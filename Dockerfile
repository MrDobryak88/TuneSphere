# ==========================================
# ЭТАП 1: Сборка приложения (Используем чистую Java 25)
# ==========================================
FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./


RUN ./mvnw dependency:go-offline -B

COPY src ./src

RUN ./mvnw clean package -DskipTests

# ==========================================
# ЭТАП 2: Запуск приложения (Остается легким)
# ==========================================
FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

# Копируем собранный jar
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]