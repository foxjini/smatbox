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
    @Column(columnDefinition = "LONGTEXT")  // Base64 문자열은 수천~수만 자가 될 수 있음
    private String photoUrl;

}
