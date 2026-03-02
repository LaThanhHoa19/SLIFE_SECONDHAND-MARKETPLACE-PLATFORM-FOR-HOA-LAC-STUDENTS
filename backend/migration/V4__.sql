CREATE TABLE user
(
    id    BIGINT AUTO_INCREMENT NOT NULL,
    email VARCHAR(255) NULL,
    reputation DOUBLE NULL,
    CONSTRAINT pk_user PRIMARY KEY (id)
);

DROP TABLE users;