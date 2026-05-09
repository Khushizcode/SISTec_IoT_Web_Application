#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#include <DHT.h>

#define DHTPIN D5
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 16, 2);

const char* ssid = "@";
const char* password = "mmmmmmmm";

String serverName =
  "https://sistec-iot-app.onrender.com";

WiFiClientSecure client;

void setup() {

  Serial.begin(115200);

  dht.begin();

  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONNECTING TO");
  lcd.setCursor(0, 1);
  lcd.print("WiFi......");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  client.setInsecure();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONNECTED TO");
  lcd.setCursor(0, 1);
  lcd.print("--WELCOME--");

  delay(2000);
}

void loop() {

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TEMPERATURE");

  lcd.setCursor(0, 1);
  lcd.print(temp);
  lcd.print(" C");

  delay(2000);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("HUMIDITY");

  lcd.setCursor(0, 1);
  lcd.print(hum);
  lcd.print("%");

  delay(2000);

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient https;

    String lcdUrl =
      serverName + "/api/lcd";

    https.begin(client, lcdUrl);

    int lcdCode = https.GET();

    String lcdText = "";

    if (lcdCode > 0) {

      lcdText = https.getString();
    }

    https.end();

    lcdText.trim();

    if (lcdText.length() > 16) {
      lcdText = lcdText.substring(0, 16);
    }

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("SISTec DISPLAY");

    lcd.setCursor(0, 1);
    lcd.print(lcdText);

    delay(3000);

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("SENDING DATA");

    lcd.setCursor(0, 1);
    lcd.print("WEB SERVER...");

    String url =
      serverName + "/api/save?temp=" + String(temp) + "&hum=" + String(hum);

    https.begin(client, url);

    int httpCode = https.GET();

    if (httpCode > 0) {

      lcd.clear();

      lcd.setCursor(0, 0);
      lcd.print("DATA SENT...");

      lcd.setCursor(0, 1);
      lcd.print("SUCCESSFULLY");

      Serial.println(
        https.getString());
    }

    else {

      lcd.clear();

      lcd.setCursor(0, 0);
      lcd.print("SEND FAILED");
    }

    https.end();
  }

  delay(1000);
}