package com.almworks.dyoma.crm.jsreports;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;

public class Server {
    private static final String address = "localhost";
    private static final int port = 8080;

    public static void main(String[] args) throws IOException {
        InetSocketAddress host = new InetSocketAddress(address, port);
        HttpServer server = HttpServer.create(host, 10);
        try {
            server.start();
            System.out.printf("com.almworks.dyoma.crm.jsreports.Server started on %s:%d\n", address, port);
        } catch (Exception e) {
            System.err.println(e);
        }
    }
}
