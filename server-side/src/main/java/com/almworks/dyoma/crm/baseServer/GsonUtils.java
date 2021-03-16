package com.almworks.dyoma.crm.baseServer;

import com.google.gson.*;

import java.lang.reflect.Type;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.function.Function;

/**
 * @author dyoma
 */
public class GsonUtils {
  public static final TemporalJsonSerializer<Instant> ISO_INSTANT = new TemporalJsonSerializer<>(DateTimeFormatter.ISO_INSTANT, Instant::from);

  public static class TemporalJsonSerializer<T extends TemporalAccessor> implements JsonDeserializer<T>, JsonSerializer<T> {
    private final DateTimeFormatter myFormatter;
    private final Function<TemporalAccessor, T> myFactory;

    public TemporalJsonSerializer(DateTimeFormatter formatter, Function<TemporalAccessor, T> factory) {
      myFormatter = formatter;
      myFactory = factory;
    }

    @Override
    public T deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
      return deserialize(json);
    }

    public T deserialize(JsonElement json) throws JsonParseException {
      String text = json.getAsString();
      return text == null ? null : myFactory.apply(myFormatter.parse(text));
    }

    @Override
    public JsonElement serialize(T src, Type typeOfSrc, JsonSerializationContext context) {
      if (src == null) return JsonNull.INSTANCE;
      return new JsonPrimitive(myFormatter.format(src));
    }
  }

}
