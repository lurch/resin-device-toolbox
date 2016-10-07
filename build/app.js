
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var Promise, actions, capitano, errors, ref, update;

Promise = require('bluebird');

capitano = Promise.promisifyAll(require('capitano'));

actions = require('./actions');

ref = require('./utils'), errors = ref.errors, update = ref.update;

capitano.command({
  signature: '*',
  action: function() {
    return capitano.execute({
      command: 'help'
    });
  }
});

capitano.globalOption({
  signature: 'help',
  boolean: true,
  alias: 'h'
});

capitano.command(actions.ssh);

capitano.command(actions.sync);

capitano.command(actions.configure);

capitano.command(actions.version);

capitano.command(actions.help.help);

update.notify();

Promise["try"](function() {
  var cli, ref1, ref2;
  cli = capitano.parse(process.argv);
  if ((ref1 = cli.global) != null ? ref1.help : void 0) {
    return capitano.executeAsync({
      command: "help " + ((ref2 = cli.command) != null ? ref2 : '')
    });
  }
  return capitano.executeAsync(cli);
})["catch"](errors.handle);
