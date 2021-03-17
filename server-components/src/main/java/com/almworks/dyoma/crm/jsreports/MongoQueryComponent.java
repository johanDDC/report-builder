package com.almworks.dyoma.crm.jsreports;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.BasicDBObject;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.json.JsonParseException;

import javax.inject.Singleton;

@Singleton
public class MongoQueryComponent {
    private final String MongoURL;
    private final MongoClient MongoClient;
    private final MongoDatabase MongoDB;

    public MongoQueryComponent(String URL, String database) {
        MongoURL = URL;
        MongoClient = MongoClients.create(MongoURL);
        MongoDB = MongoClient.getDatabase(database);
    }

//    public MongoQueryComponent() {
//        MongoURL = "mongodb://127.0.0.1:27017";
//        MongoClient = MongoClients.create(MongoURL);
//        MongoDB = MongoClient.getDatabase("netflix");
//    }

    public static JsonArray queryCollection(String collectionName, String query) throws JsonParseException {
        MongoCollection<Document> collection = MongoClients.create("mongodb://127.0.0.1:27017")
                .getDatabase("netflix")
                .getCollection(collectionName);
        Document queryDocument = Document.parse(query);
        BasicDBObject queryObj = new BasicDBObject();
        for (String key : queryDocument.keySet()) {
            Object currentVal = queryDocument.get(key);
            try {
                Document constraintObj = (Document) currentVal; // if success => value is not primitive, else Class Cast Exeption
                BasicDBObject constraint = new BasicDBObject();
                for (String localKey : constraintObj.keySet()) {
                    constraint.put(localKey, constraintObj.get(localKey));
                }
                queryObj.put(key, constraint);
            } catch (ClassCastException classCastException) {
                // if got here => current value is a primitive
                queryObj.put(key, currentVal);
            }
        }
        JsonArray result = new JsonArray();
        collection.find(queryObj).map(Document::toJson).forEach(result::add);
        return result;
    }
}