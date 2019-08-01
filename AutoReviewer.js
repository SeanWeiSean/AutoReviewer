/* 
  Environment requirements:
    OS: Windows Server(Preferred) or linux

  Environment set up:
    express (listen local ports)
    shelljs (powershell script runner)
    body-parser (js parser)
    nodemailer (send email)
    azure-devops-node-api (vsts api)

  Author:
    t-yuxwei@microsoft.com
    yusui@microsoft.com

  Date:
    7/26/2019
*/

const express = require('express')
const shell = require('shelljs')
var bodyParser = require('body-parser')
var nodemailer = require('nodemailer')
const vsts = require("azure-devops-node-api")
// Deprecated Lib (https://github.com/tanem/shelljs-plugin-authors) 
// require('shelljs-plugin-authors')

const collectionURL = "https://dev.azure.com/{yourRepo}";  
const token = "Your Token"
const app = express()
var authHandler = vsts.getPersonalAccessTokenHandler(token)
var connection = new vsts.WebApi(collectionURL, authHandler)
var vstsGit = null

main()

function init()
{
  app.get('/', function (req, res) {
    res.send('Auto Reviewer running...')
  })
  app.listen(3000, function () {
    console.log('listening on port 3000...')
  })
  app.use(bodyParser.json())
}

function main()
{
  init()
  connection.getGitApi().then(result => {vstsGit = result; console.log(result); }, error => { console.log(error); })

  var repoId
  var pullRequestId
  var title
  var projectId
  var myId
  var sourceRefName
  var targetRefName
  var changedFile = new Array()
  // var organization

  app.post("/", function (req, res) {

    // Get the details about the PR from the service hook payload
    repoId = req.body.resource.repository.id
    pullRequestId = req.body.resource.pullRequestId
    title = req.body.resource.title
    projectId = req.body.resource.repository.project.name
    myId = req.body.resource.createdBy.uniqueName
    sourceRefName = req.body.resource.sourceRefName
    targetRefName = req.body.resource.targetRefName
    sourceRefName = sourceRefName.slice(11)
    targetRefName = targetRefName.slice(11)

    var GitPullRequestSearchCriteria = {
      includeLinks : '1',
      status : 'all'
    }
    console.log("收到Create pull Request消息，启动中...")

    // 寻找谁来review
    // vstsGit.getPullRequestReviewers(repoId, pullRequestId, projectId).then( display )
    // vstsGit.getRefs(repoId, projectId).then(display)
    vstsGit.getPullRequestsByProject(projectId,GitPullRequestSearchCriteria, 100, 1100, 1000000)
    .then(result => { 
      console.log("正在获取历史PR记录...")
      console.log(result.length)

      /*  var json = JSON.stringify(result,null,2)
        var fs = require('fs')
        fs.writeFile('myjsonfile.json', json,'utf8',function(err){
          if(err) console.log("error")
          else console.log('写文件操作成功')
      });*/

      var fetchnew = shell.exec('git pull', {silent:true})
      var diffshell = "git diff --since=1.years --name-status -b "+"origin/" + targetRefName+" origin/" + sourceRefName
      // console.log(diffshell)
      var shellfordiff = shell.exec(diffshell, {silent:true})
      // console.log(shellfordiff)
      //按换行符分割字符串,存的是按\n 划分的diff信息 file:///C:/Program%20Files/Git/mingw64/share/doc/git-doc/git-diff.html--since=1.years
      var diffFile = shellfordiff.stdout.split('\n')
      // console.log("这是查找不同的文件  "+ diffFile)
      var m = 0
      var authorSet = new Set()
      var reasonMsg = new Map()
      var tmpchangedFile = new Array()
     
      //将被修改的文件存进tmpchangedFile 和 changedFile
      for(; m < diffFile.length - 1; m ++) {
        changedFile.push(diffFile[m].slice(2))
        tmpchangedFile.push(diffFile[m].slice(2))
      } 
      // console.log("这是查找不同的文件  " + changedFile.length)
      changedFile = myreplace(changedFile,'/','\\')
      // console.log(tmpchangedFile)
    
      //拼接 shell命令字符串
      for(i in changedFile) { 
        //只显示作者名字，显示最近十次的修改人名字 ,changeFile 为命令行命令//https://ruby-china.org/topics/939
        changedFile[i] = "git log --pretty=format:\"%ae\" -10 .\\" + myreplace(changedFile[i],'/','\\')
        // console.log("shellforChangedFile"+changedFile[i])
      }
         
      var k = 0
      //计算一共有多少个文件被修改
      var shellnum = changedFile.length
      for( ; k < shellnum; k ++) {
        var tmpstd = shell.exec(changedFile[k], {silent:true})
        //console.log(tmpstd)
        var tmpstdarray = tmpstd.stdout.split('\n')// name in tmpstdarray
        //cons87ole.log("tmpstdarray" + " " +tmpstdarray)
        for(i in tmpstdarray) {
          // For added reason
          if (tmpstdarray[i] == "") 
            continue

          if (tmpstdarray[i] != myId) {
            authorSet.add(tmpstdarray[i])

            if (reasonMsg.get(tmpstdarray[i])) {
              var allchangedfile = new Set();  
              allchangedfile = reasonMsg.get(tmpstdarray[i]); 
              allchangedfile.add(tmpchangedFile[k])
              reasonMsg.set(tmpstdarray[i],allchangedfile  )
              //console.log("Details:" + allchangedfile)

            } else {
              var allchangedfile =  new Set(); 
              allchangedfile.add(tmpchangedFile[k]); 
              //console.log("first set: " + allchangedfile)
              reasonMsg.set(tmpstdarray[i],allchangedfile)
              // For added reason end
            }
            // break
          }
        }
      }

      console.log(authorSet)
      // console.log(reasonMsg)
      var reviewers = new Array()
      var cnt = 1//设置为：寻找关联度最高的 cnt 个reviewer
      // git diff --name-only --cached | xargs -n 1 git blame --porcelain | grep \"^author \" | sort | uniq -c | sort -nr | head -10
     
      var authorMap = new Map()
      // 将有过PR记录的author详细信息，去重之后，存在authorMap里
      for (people in result) {
        var tmp = result[people].createdBy
        if(tmp.uniqueName != myId) {
          if (authorMap.has(tmp.uniqueName)) {
            continue

          } else {
            authorMap.set(tmp.uniqueName, tmp)
          }
        }
      }
      for( people in result) {
        var tmp = result[people].reviewers
        for(i in tmp) {
          var tmpreviewers = tmp[i].uniqueName
          if(tmpreviewers != myId) {
            if(authorMap.has(tmpreviewers)) {
              continue

            } else {
              authorMap.set(tmpreviewers, tmp[i])
            }
          }
        }
      }
      /*var authors = shell.authors('-n')   //一种简单的统计author的办法
      var tmp = authors.stdout.split('\n')*/
      console.log("正在寻找合适的reviewer")
      //通过authorSet的名字 ，在authorMap查author的详细信息,加到reviewer列表里
      authorSet.forEach(function(value) {
        if(authorMap.has(value)) {
          reviewers.push(authorMap.get(value))
        }
      })
      console.log(reviewers)
      if(reviewers.length == 0) {
        console.log("没有合适的reviewer，请自行查找！")

      } else {
        var emailstrs = ""
        for (var [key, value] of reasonMsg) {
          if(!authorMap.has(key)) {
            continue
          }
          var strs =""
          var jcnt = 1
          for(var item of value.keys()) {
            if (item) {
              strs = strs + jcnt.toString() +" : " + item.toString() + "   " 
              jcnt ++ 
            }
        }
        console.log(key + ' is added to your reviewer list as the reviewer changed the file(s): ' + strs+ "   ")
        console.log(value)
        emailstrs = emailstrs + '\n' + key.toString() + ' is added to your reviewer list as the reviewer changed the file(s): ' + strs
      }

  /*    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: '',
          pass: ''
        }
      })
      
      var mailOptions = {
        from: '',
        to: myId,
        subject: 'Successful! We have find PR reviewer(s) ',
        text: emailstrs
      }
      
      transporter.sendMail(mailOptions)*/

      // console.log(reviewers)
      //return vstsGit.createPullRequestReviewers(reviewers, repoId, pullRequestId, projectId)
    }
    
  }).then(result => {
    console.log(result);
  }, error => { 
    console.log(error);
  })
    res.send("Received the POST")
  })
}

// print log
function display(res) {
  var show = res; 
  console.log(show)
}

// remove duplicated file in list
function checkforList(changedFile, tmp) {
  var i
  for (i in changedFile)
    if (changedFile[i] == tmp.slice(5))
      return 0
  return 1
}

// replace path split placeholder '/' => '\'
function myreplace(changedFile, searchS, newS) {
  var iter
  for (iter in changedFile) {
    var s = changedFile[iter]
    while(1) {
        var oldS = s
        s = s.replace(searchS, newS)
        if (oldS == s) 
          break
    }
    changedFile[iter] = s
  }
  return changedFile
}

    