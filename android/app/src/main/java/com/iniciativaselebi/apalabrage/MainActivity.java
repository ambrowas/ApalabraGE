package com.iniciativaselebi.apalabrage;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Desvanecimiento suave y natural para enlazar el splash nativo con la app web
        splashScreen.setOnExitAnimationListener(splashScreenViewProvider -> {
            final View splashScreenView = splashScreenViewProvider.getView();
            final ObjectAnimator alpha = ObjectAnimator.ofFloat(splashScreenView, View.ALPHA, 1f, 0f);
            alpha.setDuration(350L);
            alpha.setInterpolator(new AccelerateDecelerateInterpolator());
            alpha.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    splashScreenViewProvider.remove();
                }
            });
            alpha.start();
        });
    }
}
