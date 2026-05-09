FROM eclipse-temurin:21

WORKDIR /app

COPY . .

RUN chmod +x mvnw || true

RUN ./mvnw clean package || mvn clean package

EXPOSE 8080

CMD ["java", "-cp", "target/classes", "com.bookstore.Main"]