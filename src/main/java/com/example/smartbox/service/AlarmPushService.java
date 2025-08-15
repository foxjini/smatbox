package com.example.smartbox.service;

import com.example.smartbox.model.BoxItem;
import com.example.smartbox.mqtt.MqttSender;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AlarmPushService {

    private final SimpMessagingTemplate messagingTemplate;
    private final MqttSender mqttSender;

    public void pushAlarm(BoxItem item) {
        // React WebSocket 전송
        messagingTemplate.convertAndSend("/topic/alarm", item);

        // MQTT 제어 메시지 생성 - 알람 발생 시
        String command = String.format(
                "{ \"boxNumber\": %d, \"led\": \"red\", \"buzzer\": \"on\" }",
                item.getBoxNumber()
        );
        mqttSender.sendCommand(command);
    }

    public void clearAlarm(BoxItem item) {
        // 알람 해제 시 MQTT 제어
        String ledColor = item.isStored() ? "green" : "blue";
        String command = String.format(
                "{ \"boxNumber\": %d, \"led\": \"%s\", \"buzzer\": \"off\" }",
                item.getBoxNumber(),
                ledColor
        );
        mqttSender.sendCommand(command);
    }

    public void updateBoxStatus(BoxItem item) {
        // 일반적인 박스 상태 업데이트 (알람이 아닌 경우)
        String ledColor = item.isStored() ? "green" : "blue";
        String command = String.format(
                "{ \"boxNumber\": %d, \"led\": \"%s\", \"buzzer\": \"off\" }",
                item.getBoxNumber(),
                ledColor
        );
        mqttSender.sendCommand(command);
    }
}