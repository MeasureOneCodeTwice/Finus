CREATE DATABASE finus;

CREATE TABLE finus.account (
    id         INTEGER NOT NULL AUTO_INCREMENT,
    username   VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    age        INTEGER      NOT NULL,
    created    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE finus.credentials (
    account_id INTEGER     NOT NULL,
    pw_hash    BLOB(256)   NOT NULL,
    salt       CHAR(8)     NOT NULL,
    PRIMARY KEY (account_id),
    FOREIGN KEY (account_id) REFERENCES finus.account(id) ON DELETE CASCADE
);
