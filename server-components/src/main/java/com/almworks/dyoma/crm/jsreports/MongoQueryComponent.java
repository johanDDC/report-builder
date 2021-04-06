package com.almworks.dyoma.crm.jsreports;

import com.google.gson.*;
import com.mongodb.BasicDBObject;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.json.JsonParseException;
import org.glassfish.jersey.spi.Contract;

import javax.inject.Singleton;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Singleton
@Contract
public class MongoQueryComponent {
    private final String MongoURL;
    private final MongoClient MongoClient;
    private final MongoDatabase MongoDB;

    public MongoQueryComponent(String URL, String database) {
        MongoURL = URL;
        MongoClient = MongoClients.create(MongoURL);
        MongoDB = MongoClient.getDatabase(database);
    }

    public String queryCollection(String collectionName, String query) throws JsonParseException {
        Gson gson = new GsonBuilder().serializeNulls().create();
        MongoCollection<Document> collection = MongoDB.getCollection(collectionName);
        Document queryDocument = Document.parse(query);
        List<Document> documents = collection.find(queryDocument).into(new ArrayList<>());
        JsonObject out = new JsonObject();
        List<String> columns = new ArrayList<>(documents.get(0).keySet());
        out.add("columns", gson.toJsonTree(columns));
        out.add("query", gson.toJsonTree(documents));
        System.out.println(gson.toJsonTree(documents.get(0)));
        return gson.toJson(out);
    }
}