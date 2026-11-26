package com.hop.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumCategoryDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconName;
    private Integer displayOrder;
}
