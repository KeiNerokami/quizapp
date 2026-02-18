package dev.reime.opsec;

import android.graphics.drawable.AnimatedImageDrawable;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.EditText;
import android.widget.RelativeLayout;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import java.util.List;

public class MainActivity extends AppCompatActivity {
    private AutoCompleteTextView user;
    private EditText section;

    private RelativeLayout layout;
    private Drawable bg;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);


        RelativeLayout layout = findViewById(R.id.bgMain);
        Drawable bg = layout.getBackground();

        user = findViewById(R.id.textUsername);
        section = findViewById(R.id.textSection);

        if (bg instanceof AnimatedVectorDrawable) {
            AnimatedVectorDrawable avd = (AnimatedVectorDrawable) bg;
            avd.start();
        }

        List<String> studentNames = UsernameSuggester.getStudentNames(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, studentNames);
        user.setAdapter(adapter);

        user.addTextChangedListener(new TextWatcher() {

            @Override
            public void afterTextChanged(Editable s) {
                if (s.length() > 0 && section.getVisibility() == View.GONE) {
                    show(section);
                } else if (s.length() == 0 && section.getVisibility() == View.VISIBLE) {
                    hide(section);
                }
            }

            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }
        });

        section.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                if (s.length() > 0) {
                    boolean isValid = SectionValidator.isSectionValid(MainActivity.this, s.toString());
                    if (!isValid) {
                        section.setError("Invalid section");
                    } else {
                        section.setError(null);
                    }
                }
            }
        });
    }

    private void show(View view) {
        view.setVisibility(View.VISIBLE);
        view.setAlpha(0f);
        view.setTranslationY(-50f);

        view.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(600)
                .start();
    }

    private void hide(View view) {
        view.animate()
                .alpha(0f)
                .translationY(-50f)
                .setDuration(600)
                .withEndAction(() -> view.setVisibility(View.GONE))
                .start();
    }
}
