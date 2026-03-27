CREATE DATABASE IF NOT EXISTS finus;

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
    #We use a hash algorithm which includes the salt in the hash.
    finus_account_id INTEGER     NOT NULL AUTO_INCREMENT,
    pw_hash          BLOB(256)   NOT NULL,
    PRIMARY KEY (finus_account_id),
    FOREIGN KEY (finus_account_id) REFERENCES finus.finusAccount(id) ON DELETE CASCADE
);

CREATE TABLE finus.profile (
    id          INTEGER      NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    PRIMARY KEY (id)
);

CREATE TABLE finus.finusAccount_profile (
    profile_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    PRIMARY KEY (profile_id, account_id),
    FOREIGN KEY (profile_id) REFERENCES finus.profile(id), 
    FOREIGN KEY (account_id) REFERENCES finus.finusAccount(id) ON DELETE CASCADE  -- this used to mention financialAccount, but should be mentioning finusAccount
);


CREATE TABLE finus.goal (
    id          INTEGER         NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)     NOT NULL,
    type        VARCHAR(50)     NOT NULL,
    category    VARCHAR(50),
    period      VARCHAR(1)      NOT NULL,
    target      DECIMAL(12,2)   NOT NULL, -- this is the monetary amount that we are trying to reach, there is no current amount to track, as that is just recalculated from the transactions
    PRIMARY KEY (id)
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
    -- Note that there are other types of accounts such as joint, business, transmission, etc. This simplified set is good enough for now
    -- type ENUM('savings', 'chequing', 'credit') DEFAULT 'unconfirmed',
    PRIMARY KEY (type)
);

CREATE TABLE finus.financialAccountSubtype(
    subtype VARCHAR(50) NOT NULL,
    -- These subtypes are really only needed for savings accounts as they can be taxed differently and might have weird rules about them
    -- type ENUM('RRSP', 'TFSA', 'FHSA', 'RESP', 'RDSP') DEFAULT 'NA',
    PRIMARY KEY (subtype)
);

CREATE TABLE finus.financialAccount (
    id           INTEGER      NOT NULL AUTO_INCREMENT,
    name         VARCHAR(50)  NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    balance      DECIMAL(12,2)      NOT NULL,
    value        INTEGER      NOT NULL,
    last_updated DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    subtype      VARCHAR(50), 
    PRIMARY KEY (id),
    FOREIGN KEY (type)    REFERENCES finus.financialAccountType(type) ON DELETE CASCADE,
    FOREIGN KEY (subtype) REFERENCES finus.financialAccountSubtype(subtype) ON DELETE CASCADE

);

CREATE TABLE finus.profile_financialAccount (
    profile_id INTEGER NOT NULL,
    financialAccount_id INTEGER NOT NULL,
    PRIMARY KEY (profile_id, financialAccount_id),
    FOREIGN KEY (profile_id) REFERENCES finus.profile(id), 
    FOREIGN KEY (financialAccount_id) REFERENCES finus.financialAccount(id) ON DELETE CASCADE
);

CREATE TABLE finus.transaction (
    id                  INTEGER       NOT NULL AUTO_INCREMENT,
    financialAccount_id INTEGER       NOT NULL,
    amount              INTEGER       NOT NULL,
    category            VARCHAR(50)   NOT NULL, -- Had to add this for analytics
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

CREATE TABLE finus.investmentType(
    type VARCHAR(50) NOT NULL,
    PRIMARY KEY (type)
);

CREATE TABLE finus.investment (
    id           INTEGER      NOT NULL AUTO_INCREMENT,
    account_id   INTEGER      NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    name         VARCHAR(50)  NOT NULL,
    description  VARCHAR(500) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (account_id) REFERENCES finus.financialAccount(id) ON DELETE CASCADE,
    FOREIGN KEY (type)       REFERENCES finus.investmentType(type)
);


CREATE TABLE finus.investmentState (
    investment_id INTEGER NOT NULL,
    quantity      DOUBLE  NOT NULL DEFAULT 1,
    total_cost    DOUBLE  NOT NULL,
    at            DATETIME         DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investment_id),
    FOREIGN KEY (investment_id) REFERENCES finus.investment(id) ON DELETE CASCADE
);


## Example of adding extra data
CREATE TABLE finus.stockInvestment(
    investment_id INTEGER     NOT NULL, 
    symbol        VARCHAR(50) NOT NULL,
    PRIMARY KEY (investment_id),
    FOREIGN KEY (investment_id) REFERENCES finus.investment(id)
);

CREATE TABLE finus.fixedInterestInvestment(
    investment_id    INTEGER NOT NULL,
    rate             DOUBLE  NOT NULL,
    frequency_years  INTEGER NOT NULL,
    frequency_months INTEGER NOT NULL,
    PRIMARY KEY (investment_id),
    FOREIGN KEY (investment_id) REFERENCES finus.investment(id) ON DELETE CASCADE
);

#Populate lookup tables
INSERT INTO finus.financialAccountType    (type) VALUES ('Chequing'), ('Savings'), ('Credit Card'), ('Investment');
INSERT INTO finus.financialAccountSubtype (subtype) VALUES ('RRSP'), ('TFSA'), ('FHSA'), ('RESP'), ('RDSP'), ('Loan'), ('na');
-- loan is used for credit_card accounts that are for loans like mortgage and etc, this is used to track debt
INSERT  INTO finus.investmentType          (type) VALUES ('fixedInterest'), ('stock'); #These have to match table names

