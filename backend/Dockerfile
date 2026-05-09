FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN mvn clean package

FROM eclipse-temurin:21

WORKDIR /app

COPY --from=build /app/target/onlinebookstore-backend-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]