# ---- Build stage ----
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copy only what's needed to resolve dependencies first, so this layer is
# cached and Docker doesn't re-download the whole dependency tree on every
# source change — only when pom.xml itself changes.
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw clean package -DskipTests -B

# ---- Runtime stage ----
# JRE, not JDK — no compiler needed to just run the built jar, smaller image.
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
