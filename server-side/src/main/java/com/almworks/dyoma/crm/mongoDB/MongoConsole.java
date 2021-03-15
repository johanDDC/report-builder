package com.almworks.dyoma.crm.mongoDB;

import com.google.gson.*;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.DateFormat;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class MongoConsole {
    /**
     * Resource folder requires workong directory in server-side
     */
    private static final String resourceFolder = "src/main/resources/";
    private static final JsonDeserializer<Date> dateDeserializer = new JsonDeserializer<Date>() {
        @Override
        public Date deserialize(JsonElement json, Type typeOfT,
                                JsonDeserializationContext context) throws JsonParseException {
            try {
                return DateFormat.getDateInstance().parse(json.getAsString().trim());
            } catch (ParseException e) {
                e.printStackTrace();
                return null;
            }
        }
    };
    private static final JsonDeserializer<Duration> durationDeserializer = new JsonDeserializer<Duration>() {
        @Override
        public Duration deserialize(JsonElement jsonElement, Type type,
                                    JsonDeserializationContext jsonDeserializationContext) throws JsonParseException {
            Duration res = new Duration();
            String duration = jsonElement.getAsString();
            if (jsonElement.getAsString().contains("min")) {
                res.mins = Integer.parseInt(duration.substring(0, duration.indexOf(" min")));
            } else {
                res.seasons = Integer.parseInt(duration.substring(0, duration.indexOf(" Season")));
            }
            return res;
        }
    };
    private static final Gson databaseParser = new GsonBuilder()
            .registerTypeAdapter(Date.class, dateDeserializer)
            .registerTypeAdapter(Duration.class, durationDeserializer)
            .create();

    private static final String MongoURL = "mongodb://127.0.0.1:27017";

    static private NetflixEntry readEntry() throws IOException {
        Reader reader = Files.newBufferedReader(Paths.get(resourceFolder + "com/almworks/dyoma/crm/mongoDB/recordExample.json"));
        String fileContent = JsonParser.parseReader(reader).getAsString();
        return databaseParser.fromJson(fileContent
                , NetflixEntry[].class)[0];
    }

    static private NetflixEntry[] readEntries() throws IOException {
        try (Reader reader = new InputStreamReader(MongoConsole.class.getResourceAsStream("DB.json"))) {
            return databaseParser.fromJson(reader, NetflixEntry[].class);
        }
    }

    public static void main(String[] args) throws ParseException, IOException {
        MongoClient mongoClient = MongoClients.create(MongoURL);
        MongoDatabase database = mongoClient.getDatabase("netflix");
        MongoCollection<Document> collection = database.getCollection("testCollection");
        NetflixEntry[] entries = readEntries();
        List<Document> documents = new ArrayList<>();
        for (NetflixEntry entry : entries) {
            documents.add(entry.getDocument());
        }
        collection.insertMany(documents);
    }

    private static class NetflixEntry {
        private String show_id;
        private String type;
        private String title;
        private String director;
        private List<String> cast;
        private String country;
        private Date date_added;
        private int release_year;
        private String rating;
        private Duration duration;
        private List<String> listed_in;
        private String description;

        public Document getDocument() {
            return new Document("show_id", show_id)
                    .append("type", type)
                    .append("title", title)
                    .append("director", director)
                    .append("cast", cast)
                    .append("country", country)
                    .append("date_added", date_added)
                    .append("release_year", release_year)
                    .append("rating", rating)
                    .append("duration", duration.get())
                    .append("listed_in", listed_in)
                    .append("description", description);
        }
    }

    private static class Duration {
        public Integer mins;
        public Integer seasons;

        public Document get() {
            if (mins != null) {
                return new Document("mins", mins);
            } else {
                return new Document("seasons", seasons);
            }
        }
    }
}
