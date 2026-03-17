# syntax=docker/dockerfile:1.7

FROM maven:3.9.9-eclipse-temurin-17-alpine AS deps
WORKDIR /app
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -DskipTests dependency:go-offline

FROM deps AS builder
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -DskipTests clean package && \
    cp target/*.jar /app/app.jar

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=builder /app/app.jar ./app.jar
# Tạo thư mục uploads và cấp quyền cho user spring trước khi switch.
# Khi Docker khởi tạo named volume uploads_data (lần đầu còn rỗng),
# nó copy ownership này vào volume, đảm bảo spring user có quyền write.
RUN mkdir -p /app/uploads/listings && chown -R spring:spring /app/uploads
USER spring:spring
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
