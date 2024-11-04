## Keiba Scraping Project

### Projects
1. getShubobaLinks  
Get all Shuboba links from "種牡馬Profile(http://keiba.no.coocan.jp)"  
result url list is written out to /txt  

2. getShubobaData  
Get all Shuboba data from each url in /txt to /csv files from "種牡馬Profile(http://keiba.no.coocan.jp)"  
drop 1-getShubobaLinks text data into /txt  

3. getShubobaUrl  
Get all results of Shuboba's url from "NetKeiba(http://netkeiba.com)"  
select csv file which A column is horse name    

4. getCropsData  
Get all urls of Shuboba's crops results from "NetKeiba(http://netkeiba.com)"  
select 3-getShubobaUrl /output csv data  

5. getTraining  
Get all training data from "NetKeiba(http://netkeiba.com)"  
write loginid and password to root .env file, select 4-getCropsData /output csv data  
<.env>  
NETKEIBA_ID = 'mail@test.com'  
NETKEIBA_PASS = 'password'