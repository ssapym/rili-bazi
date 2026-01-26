项目根目录下的index.html以及对应的bazi.js paipan.gx.js shensha.js等文件不要修改，启动SPA网页版命令为python3 -m http.server 8001 ；
server目录下的是SPA相同逻辑的API版本，启动API命令为要使用server目录下的start.command，停止API使用server目录下的stop.command，重启API使用server目录下的restart.command，默认端口为8000；
SPA网页的计算逻辑是正确的，本项目需要维护API版本的计算逻辑，保持一致；
API版本使用了tyme4ts库，SPA版本引入的是tyme.min.js文件；
不要运行危险命令，尤其是严格禁止执行pkill；
运行命令前要查看文档docs目录下的说明文件；
测试脚本在test目录下，运行命令为node index.js，具体说明看docs目录下的TEST_GUIDE.md文件；
生成的代码都要有完整的注释，包括函数、类、模块等，也要有必要的说明，方便其他开发者理解和使用；