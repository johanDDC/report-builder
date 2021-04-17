package com.almworks.dyoma.crm.jsreports;

import com.google.gson.*;
import com.mongodb.BasicDBObject;
import com.mongodb.client.*;
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

    public String queryCollection(String collectionName, String query, String projection,
                                  Integer limit, Integer offset, String sort) throws JsonParseException {
        MongoCollection<Document> collection = MongoDB.getCollection(collectionName);
        Document queryDocument = Document.parse(query);
        FindIterable<Document> iterDoc = collection.find(queryDocument);
        if (projection != null) {
            iterDoc.projection(Document.parse(projection));
        }
        if (limit != null) {
            iterDoc.limit(limit);
        }
        if (offset != null) {
            iterDoc.skip(offset);
        }
        if (sort != null) {
            iterDoc.sort(Document.parse(sort));
        }
        List<Document> documents = iterDoc.into(new ArrayList<>());
        StringBuilder result = new StringBuilder("[");
        for (int i = 0; i < documents.size(); i++) {
            if (i > 0) {
                result.append(',');
            }
            result.append(documents.get(i).toJson());
        }
        return result.append(']').toString();
    }
}