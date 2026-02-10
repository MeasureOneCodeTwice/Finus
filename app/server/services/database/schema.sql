CREATE DATABASE IF NOT EXISTS finus;

CREATE TABLE finus.finusAccount (
    id         INTEGER NOT NULL AUTO_INCREMENT,
    username   VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    created    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_finus_account_email (email)
);

CREATE TABLE finus.credentials (
    finus_account_id INTEGER     NOT NULL,
    pw_hash          BLOB(256)   NOT NULL,
    salt             CHAR(8)     NOT NULL,
    PRIMARY KEY (finus_account_id),
    FOREIGN KEY (finus_account_id) REFERENCES finus.finusAccount(id) ON DELETE CASCADE
);


