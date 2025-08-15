package com.example.smartbox.mqtt;

import lombok.RequiredArgsConstructor;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MqttSender {

    @Value("${mqtt.broker}")
    private String brokerUrl;

    @Value("${mqtt.client-id}")
    private String clientId;

    @Value("${mqtt.topic.command}")
    private String topic;

    private MqttClient client;

    public void connect() {
        try {
            if (client == null || !client.isConnected()) {
                client = new MqttClient(brokerUrl, clientId + "-sender");
                client.connect();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendCommand(String message) {
        try {
            connect(); // MQTT 연결 보장
            MqttMessage mqttMessage = new MqttMessage(message.getBytes());
            client.publish(topic, mqttMessage);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}