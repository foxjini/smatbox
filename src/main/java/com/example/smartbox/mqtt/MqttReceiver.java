package com.example.smartbox.mqtt;

import com.example.smartbox.model.BoxItem;
import com.example.smartbox.service.AlarmPushService;
import com.example.smartbox.service.BoxItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
@RequiredArgsConstructor
public class MqttReceiver {

    private final BoxItemService boxItemService;
    private final AlarmPushService alarmPushService;

    @Value("${mqtt.broker}")
    private String brokerUrl;
    @Value("${mqtt.client-id}")
    private String clientId;
    @Value("${mqtt.topic.status}")
    private String topic;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        try {
            MqttClient client = new MqttClient(brokerUrl, clientId + "-receiver");
            client.connect();
            client.subscribe(topic, (t, msg) -> {
                String payload = new String(msg.getPayload());
                BoxItem item = objectMapper.readValue(payload, BoxItem.class);
                boxItemService.update(item.getBoxNumber(), item);
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
