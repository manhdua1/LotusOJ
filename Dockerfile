# ==========================================
# Stage 1: Build JAR using Eclipse Temurin 26
# ==========================================
FROM eclipse-temurin:26-jdk-alpine AS builder
WORKDIR /build

# Copy Maven wrapper & pom.xml for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw

# Cache dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ==========================================
# Stage 2: Minimal Runtime Container
# ==========================================
FROM eclipse-temurin:26-jdk-alpine
WORKDIR /app

# Install docker-cli to allow DockerExecutor to run judge sandbox containers
RUN apk add --no-cache docker-cli

# Directory for mounting shared judge sandbox volume
RUN mkdir -p /judge_workspace

# Copy compiled JAR from builder stage
COPY --from=builder /build/target/lotusoj-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
