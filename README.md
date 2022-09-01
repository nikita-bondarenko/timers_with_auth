### Project setup
```
npm install
```
### Compiles and hot-reloads for development
``` 
npm run start
``` 

In this application, you can create your own user, start and stop timers. The app uses MongoDb. Timers's menegment is realized through WebSockets.

An important point: to prevent conflict between the Vue and Nunjucks syntaxes, the latest sentiment is to use square brackets instead of curly braces for server-side templates:
```js
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
```
