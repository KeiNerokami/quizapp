package dev.reime.opsec;

import android.content.Context;
import android.content.res.AssetManager;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class UsernameSuggester {

    public static List<String> getStudentNames(Context context) {
        List<String> studentNames = new ArrayList<>();
        try {
            String jsonString = loadJSONFromAsset(context, "collected.json");
            JSONObject obj = new JSONObject(jsonString);
            JSONArray studentsArray = obj.getJSONArray("students");

            for (int i = 0; i < studentsArray.length(); i++) {
                JSONObject student = studentsArray.getJSONObject(i);
                studentNames.add(student.getString("student_name"));
            }
        } catch (JSONException | IOException e) {
            e.printStackTrace();
        }
        return studentNames;
    }

    private static String loadJSONFromAsset(Context context, String fileName) throws IOException {
        String json;
        AssetManager assetManager = context.getAssets();
        InputStream is = assetManager.open(fileName);
        int size = is.available();
        byte[] buffer = new byte[size];
        is.read(buffer);
        is.close();
        json = new String(buffer, StandardCharsets.UTF_8);
        return json;
    }
}
