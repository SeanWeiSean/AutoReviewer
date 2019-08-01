Pull Request Tools 0.1  
=========================
<p align="left">
    <a href='https://travis-ci.org/meolu/walle-web'><img src='https://travis-ci.org/meolu/walle-web.svg?branch=master' alt="Build Status"></a>  
    <a href='https://gitter.im/meolu/walle-web'><img src='https://badges.gitter.im/Join%20Chat.svg'></a>
</p>

A tool for reviewer recommendation and automatic adding in DevOps, Microsoft


Feature
=========================
- A lightweight web framework, easy to deploy.
- Customizable recommendation algorithm by git.

Architecture
=========================
![](https://github.com/SeanWeiSean/PullRequestTools/blob/master/WorkFlow.png?raw=true)  
  
   
Initialization 
=========================
Localhost or Azure server in Windows or Linux.
Download #[nodejs](https://nodejs.org/en/download/) 
1) From the command line, create a new project folder for your web server
```bash
   mkdir pr-server
   cd pr-server
```
2) Create a new package.json file for the project.
```bash
   npm init
```
　　Press Enter to accept the defaults for all of the options except the entry point. Change it to autoReviewer.js
```bash
    entry point: (index.js) autoReviewer.js
```
3) Install Express in the pr-server directory using the following command.
```bash
   npm install express
```
4) Replace the project URL and token with your own RepoUrl and Token.
![](https://github.com/SeanWeiSean/PullRequestTools/blob/master/URL3.jpg?raw=true)
5) Replace the autoReviewer.js with our project then run it.
```bash
   npm install body-parser
   npm install azure-devops-node-api
   npm i nodemailer
   npm i shelljs
   node autoReviewer.js
```
6) You shall have cmd show as below
![](https://github.com/SeanWeiSean/PullRequestTools/blob/master/url4.png?raw=true)  
 
Web Hook Deployment in DevOps
=========================
![](https://github.com/SeanWeiSean/PullRequestTools/blob/master/ins1.png?raw=true)
1) Click the DevOps as the picture's instruction.
3) Then we choose **Web Hook** options.  
3) Select **Pull request created from the list of event** triggers, then select **Next**.
4) In the Action page, enter the ***URL:port*** your tools listening. Select Test to send a test event to your server.
5) select **Finish** to create the service hook.
<br><br><br><br><br><br><br><br><br><br><br><br><br>
<br><br><br><br><br><br><br><br><br><br><br><br><br>





