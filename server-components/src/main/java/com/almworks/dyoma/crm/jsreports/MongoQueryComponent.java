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
        MongoCollection<Document> collection = MongoDB.getCollection(collectionName);
        Document queryDocument = Document.parse(query);
        List<Document> documents = new ArrayList<>();
        collection.find(queryDocument).forEach(documents::add);
        return new Gson().toJson(documents);
    }
}