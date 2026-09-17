import Foundation
import PDFKit

let url = URL(fileURLWithPath: "/Users/elebi/Downloads/Primera Edicion-Dic2023_OCR.pdf")
guard let doc = PDFDocument(url: url) else {
    print("Failed to open PDF")
    exit(1)
}

struct TopicExtract: Codable {
    let page: Int
    let topicNumber: Int
    let title: String
    let words: [String]
}

var results: [TopicExtract] = []

let symbolRegex = try! NSRegularExpression(pattern: "[●‹٧一•]", options: [])
let validWordRegex = try! NSRegularExpression(pattern: "^[A-ZÁÉÍÓÚÑa-záéíóúñ\\s\\-\\.\\'\\(\\)]+$", options: [])

for i in 2..<32 {
    guard let page = doc.page(at: i) else { continue }
    let text = page.string ?? ""
    let lines = text.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    
    var title = ""
    var topicNum = i - 1
    for l in lines {
        if l.range(of: #"^\d+[\.\s]+"#, options: .regularExpression) != nil {
            title = l
            if let numStr = l.components(separatedBy: ".").first, let n = Int(numStr) {
                topicNum = n
            }
            break
        }
    }
    if title.isEmpty { title = lines.first ?? "Tema \(topicNum)" }
    
    var words: [String] = []
    
    // The bottom section contains the words. Check lines from index 20 onwards.
    let startIdx = min(20, lines.count)
    for idx in startIdx..<lines.count {
        let l = lines[idx]
        if l == title { continue }
        if symbolRegex.firstMatch(in: l, options: [], range: NSRange(location: 0, length: l.utf16.count)) != nil {
            continue
        }
        let clean = l.replacingOccurrences(of: " ", with: "")
        // Random matrix row is 23+ uppercase characters without spaces
        if clean.count >= 24 && !l.contains(" ") {
            continue
        }
        // Skip page number
        if Int(l) != nil && l.count <= 2 {
            continue
        }
        
        let range = NSRange(location: 0, length: l.utf16.count)
        if l.count >= 3 && validWordRegex.firstMatch(in: l, options: [], range: range) != nil {
            words.append(l)
        }
    }
    
    results.append(TopicExtract(page: i + 1, topicNumber: topicNum, title: title, words: words))
    print("Page \(i+1) [\(title)]: \(words.count) palabras")
    print("   Ejemplo: \(words.prefix(5).joined(separator: ", "))")
}

let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
if let data = try? encoder.encode(results) {
    try? data.write(to: URL(fileURLWithPath: "/Users/elebi/Documents/Aplicaciones/ApalabraGE/src/data/ocrSopasWords.json"))
    print("\n✅ Guardado en src/data/ocrSopasWords.json!")
}
