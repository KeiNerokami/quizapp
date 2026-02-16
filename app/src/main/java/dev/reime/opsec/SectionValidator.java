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

public class SectionValidator {

    public static boolean isSectionValid(Context context, String section) {
        try {
            JSONObject obj = new JSONObject(loadJSONFromAsset(context));
            JSONArray sectionsArray = obj.getJSONArray("sections");
            List<String> sections = new ArrayList<>();
            for (int i = 0; i < sectionsArray.length(); i++) {
                sections.add(sectionsArray.getString(i));
            }

            for (String validSection : sections) {
                if (validSection.equalsIgnoreCase(section)) {
                    return true;
                }
            }
        } catch (JSONException | IOException e) {
            e.printStackTrace();
        }
        return false;
    }

    private static String loadJSONFromAsset(Context context) throws IOException {
        String json;
        AssetManager assetManager = context.getAssets();
        InputStream is = assetManager.open("reference.json");
        int size = is.available();
        byte[] buffer = new byte[size];
        is.read(buffer);
        is.close();
        json = new String(buffer, StandardCharsets.UTF_8);
        return json;
    }
}
