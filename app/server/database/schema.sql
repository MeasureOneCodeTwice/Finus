CREATE DATABASE finus;

CREATE TABLE finus.finusAccount (
    id         INTEGER      NOT NULL AUTO_INCREMENT,
    username   VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    age        INTEGER      NOT NULL,
    created    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE finus.credentials (
    finus_account_id INTEGER     NOT NULL AUTO_INCREMENT,
    pw_hash          BLOB(256)   NOT NULL,
    salt             CHAR(8)     NOT NULL,
    PRIMARY KEY (finus_account_id),
    FOREIGN KEY (finus_account_id) REFERENCES finus.finusAccount(id) ON DELETE CASCADE
);

CREATE TABLE finus.profile (
    id          INTEGER      NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    PRIMARY KEY (id)
);

CREATE TABLE finus.goalType (
    type VARCHAR(50) NOT NULL,
    PRIMARY KEY (type)
);

CREATE TABLE finus.goal (
    id          INTEGER         NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)     NOT NULL,
    type        VARCHAR(50)     NOT NULL,
    objective   VARCHAR(500)    NOT NULL,
    description VARCHAR(500),
    deadline    DATETIME, 
    PRIMARY KEY (id),
    FOREIGN KEY (type) REFERENCES finus.goalType(type) ON DELETE CASCADE

);

CREATE TABLE finus.profile_goal (
    profile_id INTEGER NOT NULL,
    goal_id    INTEGER NOT NULL,
    PRIMARY KEY (profile_id, goal_id), 
    FOREIGN KEY (profile_id) REFERENCES finus.profile(id),
    FOREIGN KEY (goal_id)    REFERENCES finus.goal(id)
);

CREATE TABLE finus.financialAccountType (
    type VARCHAR(50) NOT NULL,
    PRIMARY KEY (type)
);

CREATE TABLE finus.financialAccountSubtype(
    type VARCHAR(50) NOT NULL,
    PRIMARY KEY (type)
);

CREATE TABLE finus.financialAccount (
    id           INTEGER      NOT NULL,
    name         VARCHAR(50)  NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    balance      INTEGER      NOT NULL,
    value        INTEGER      NOT NULL,
    last_updated DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    subtype      VARCHAR(50), 
    PRIMARY KEY (id),
    FOREIGN KEY (type)    REFERENCES finus.financialAccountType(type) ON DELETE CASCADE,
    FOREIGN KEY (subtype) REFERENCES finus.financialAccountType(type) ON DELETE CASCADE

);

CREATE TABLE finus.finusAccount_profile (
    profile_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    PRIMARY KEY (profile_id, account_id),
    FOREIGN KEY (profile_id) REFERENCES finus.profile(id), 
    FOREIGN KEY (account_id) REFERENCES finus.financialAccount(id) ON DELETE CASCADE
);

CREATE TABLE finus.transaction (
    id                  INTEGER       NOT NULL AUTO_INCREMENT,
    financialAccount_id INTEGER       NOT NULL,
    amount              INTEGER       NOT NULL,
    description         VARCHAR(500),
    sender              VARCHAR(50),
    recipient           VARCHAR(50),
    date                DATETIME, 
    PRIMARY KEY (id),
    FOREIGN KEY (financialAccount_id) REFERENCES finus.financialAccount(id) ON DELETE CASCADE
);

CREATE TABLE finus.asset (
    id                  INTEGER NOT NULL AUTO_INCREMENT,
    name                VARCHAR(50) NOT NULL,
    fixed_compound_rate DOUBLE,
    PRIMARY KEY (id)
);

CREATE TABLE finus.investment (
    id           INTEGER      NOT NULL AUTO_INCREMENT,
    account_id   INTEGER      NOT NULL,
    name         VARCHAR(50)  NOT NULL,
    description  VARCHAR(500) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (account_id) REFERENCES finus.financialAccount(id) ON DELETE CASCADE
);

CREATE TABLE finus.investmentInterestRate (
    investment_id    INTEGER NOT NULL,
    rate             DOUBLE  NOT NULL,
    frequency_years  INTEGER NOT NULL,
    frequency_months INTEGER NOT NULL,
    PRIMARY KEY (investment_id),
    FOREIGN KEY (investment_id) REFERENCES finus.investment(id) ON DELETE CASCADE
);

CREATE TABLE finus.investmentState (
    investment_id INTEGER NOT NULL,
    quantity      DOUBLE  NOT NULL DEFAULT 1,
    total_cost    DOUBLE  NOT NULL,
    at            DATETIME         DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investment_id),
    FOREIGN KEY (investment_id) REFERENCES finus.investment(id) ON DELETE CASCADE
);

#Populate lookup tables
#INSERT INTO finus.financialAccountType    (type) VALUES ();
#INSERT INTO finus.financialAccountSubtype (type) VALUES ();
 INSERT INTO finus.goalType                (type) VALUES ('money'), ('debt');
