### Typescript services 
Each service inherits from this directory's:
* packages
* tsconfig
* eslint.config

Unless a package will be used in multiple modules install it only in the subdirectory (by running `bun install` in the module directory, not this one).  

The `common` folder is home for modules that are used by one or more services. For example `common/port.ts` is used by all services to determine which port to bind their webserver to.

