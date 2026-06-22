package com.tunesphere.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TuneSphere API")
                        .description("Music Streaming Platform like SoundCloud")
                        .version("1.0")
                        .contact(new Contact()
                                .name("TuneSphere Team")
                                .email("support@tunesphere.com")));
    }
}