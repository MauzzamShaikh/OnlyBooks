FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN mvn clean package

FROM eclipse-temurin:21

WORKDIR /app

COPY --from=build /app/target/classes ./target/classes

EXPOSE 8080

CMD ["java", "-cp", "target/classes", "com.bookstore.Main"]