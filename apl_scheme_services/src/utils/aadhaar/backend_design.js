Use Case:
Encryption and Decrption Logic is here:
apl_scheme_services/src/utils/aadhaar/aadhaar_util.js

I have table in DB APL_DATA with column name uid which is encrypted value of Aadhaar number.
Now I have to use the decryption logic in the above script to decrypt the value of uid column with the salt key and mask - show last 4 digit and store in seperate column - masked_aadhaar_no in same table in Postgress DB.

Need solution in this folder 
apl_scheme_services/src/utils/aadhaar/aadhaar_db_script.js


I need Script to execute the decryption logic and update the masked_aadhaar_no column in the APL_DATA table with the masked value of Aadhaar number. The script should be able to run as a standalone Node.js script and connect to the Postgres database to perform the necessary operations.

Here is a sample script that connects to the Postgres database, retrieves the encrypted Aadhaar numbers from the APL_DATA table, decrypts them using the logic from aadhaar_util.js, masks the Aadhaar numbers to show only the last 4 digits, and updates the masked_aadhaar_no column in the APL_DATA table.
apl_scheme_services/src/utils/aadhaar/aadhaar_migrate.js

