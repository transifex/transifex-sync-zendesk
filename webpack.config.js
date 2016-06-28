 var path = require('path');

 module.exports = {
     entry: './src/app.js',
     output: {
         path: './dist',
         filename: 'app.bundle.js'
     },
    resolve: {
    	root: path.resolve('./lib'),
    	extensions: ['', '.js']
  }
 };