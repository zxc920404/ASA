import { exec } from 'child_process';

exec('npm test', (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  if (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});
