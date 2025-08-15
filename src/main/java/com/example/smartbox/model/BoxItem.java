package com.example.smartbox.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoxItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int boxNumber; // 0~5
    private String itemName;
    @Column(name = "stored_flag")
    private boolean stored;
    private LocalDateTime reservedTime;
    private boolean alarmOn;
    @Column(columnDefinition = "TEXT") // base64 문자열은 길 수 있으므로 TEXT로
    private String photoUrl;

}
