#include <Arduino.h>
#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>

// put function declarations here:
void setColor(float r, float g, float b);
void setColorFromOSC(OSCMessage &msg);

#define NUM_LEDS 30
CRGB leds[NUM_LEDS];

WiFiUDP udp;

void setup()
{
  Serial.begin(115200);

  FastLED.addLeds<WS2811, 2, GRB>(leds, NUM_LEDS);

  // Connect to WiFi
  const char *ssid = "Ultreia";
  const char *password = "inyourtrust";

  WiFi.begin(ssid, password);
  setColor(0, 1, 1);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi, ip = " + WiFi.localIP().toString());
  // Advertise service as "TraceLamp"
  MDNS.begin("TraceLamp");
  MDNS.addService("osc", "udp", 9000);

  setColor(.2, 1, 0);
  delay(500);
  setColor(0, 0, 0);

  // Start UDP
  udp.begin(9000);
}

void loop()
{
  // Your main code here
  // receive osc and set color

  int packetSize = udp.parsePacket();

  if (packetSize)
  {
    OSCMessage msg;
    while (packetSize--)
    {
      msg.fill(udp.read());
    }

    if (!msg.hasError())
    {
      msg.dispatch("/color", setColorFromOSC);
    }
  }
  delay(1);
}

void setColorFromOSC(OSCMessage &msg)
{
  setColor(msg.getFloat(0), msg.getFloat(1), msg.getFloat(2));
}

// put function definitions here:
void setColor(float r, float g, float b)
{
  // Serial.println("set color " + String(r) + ", " + String(g) + ", " + String(b));
  LEDS.showColor(CRGB(r * 255, g * 255, b * 255));
}