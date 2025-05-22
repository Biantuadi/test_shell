import { expect } from 'chai';
import * as chai from 'chai'; 
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import * as commandsModule from '../src/commands/index.js';
import { executeCommandString } from '../src/shell.js';

chai.use(sinonChai); 

const { commands, history, aliases } = commandsModule;

let consoleLogStub;
let consoleErrorStub;

beforeEach(() => {
  consoleLogStub = sinon.stub(console, 'log');
  consoleErrorStub = sinon.stub(console, 'error');
  history.length = 0;
  aliases.clear();
});

afterEach(() => {
  consoleLogStub.restore();
  consoleErrorStub.restore();
});

describe('Shell Commands', () => {

  describe('Calculator Command', () => {
    it('should perform basic arithmetic operations', async () => {
      await commands.calc(['2', '+', '3']);
      expect(consoleLogStub).to.have.been.calledWith('2 + 3 = 5');
    });

    it('should handle power operations', async () => {
      await commands.calc(['2', '^', '3']);
      expect(consoleLogStub).to.have.been.calledWith('2 ** 3 = 8');
    });

    it('should handle complex expressions', async () => {
      await commands.calc(['2', '+', '2', '*', '3']);
      expect(consoleLogStub).to.have.been.calledWith('2 + 2 * 3 = 8');
    });

    it('should handle invalid expressions', async () => {
      await commands.calc(['2', '+', 'abc']);
      expect(consoleErrorStub).to.have.been.calledWith('Invalid expression. Only numbers and basic operators are allowed.');
    });
  });

  describe('Sort Command', () => {
    it('should sort numbers', async () => {
      await commands.sort(['5', '2', '8', '1', '9']);
      expect(consoleLogStub).to.have.been.calledWith('1 2 5 8 9');
    });

    it('should handle invalid numbers', async () => {
      await commands.sort(['5', 'abc', '8']);
      expect(consoleErrorStub).to.have.been.calledWith('Invalid number: abc');
    });
  });

  describe('Alias Command', () => {
    it('should create a new alias', async () => {
      await commands.alias(['ll', 'ls', '-l']);
      expect(aliases.get('ll')).to.equal('ls -l');
    });

    it('should display all aliases', async () => {
      aliases.set('ll', 'ls -l');
      aliases.set('la', 'ls -la');
      await commands.alias([]);
      expect(consoleLogStub).to.have.been.calledWith("ll='ls -l'");
      expect(consoleLogStub).to.have.been.calledWith("la='ls -la'");
    });

    it('should display specific alias', async () => {
      aliases.set('ll', 'ls -l');
      await commands.alias(['ll']);
      expect(consoleLogStub).to.have.been.calledWith("ll='ls -l'");
    });

    it('should handle non-existent alias', async () => {
      await commands.alias(['nonexistent']);
      expect(consoleLogStub).to.have.been.calledWith("Alias 'nonexistent' not found");
    });

    it('should prevent recursive aliases', async () => {
      await commands.alias(['test', 'test']);
      expect(consoleErrorStub).to.have.been.calledWith("Error: Cannot create recursive alias 'test'");
    });

    it('should prevent circular aliases', async () => {
      aliases.set('a', 'b');
      console.log('Test - Initial aliases:', Array.from(aliases.entries()));
      await commands.alias(['b', 'a']);
      console.log('Test - Final aliases:', Array.from(aliases.entries()));
      expect(consoleErrorStub.called).to.be.true;
      expect(consoleErrorStub.firstCall.args[0]).to.include('Circular alias detected');
    });
  });

  describe('History Command', () => {
    it('should display command history', async () => {
      history.push('ls');
      history.push('pwd');
      await commands.history();
      expect(consoleLogStub).to.have.been.calledWithMatch(/1\s+\d{2}:\d{2}:\d{2}\s+ls/);
      expect(consoleLogStub).to.have.been.calledWithMatch(/2\s+\d{2}:\d{2}:\d{2}\s+pwd/);
    });

    it('should handle empty history', async () => {
      await commands.history();
      expect(consoleLogStub).to.have.been.calledWith('No commands in history');
    });
  });

  describe('Tree Command', () => {
    it('should display directory structure', async () => {
      await commands.tree();
      expect(consoleLogStub).to.have.been.calledWith('.');
    });
  });

  describe('PS Command', () => {
    it('should display process list', async () => {
      await commands.ps();
      expect(consoleLogStub).to.have.been.calledWith('F S UID   PID  PPID  C PRI  NI ADDR SZ WCHAN TTY        TIME CMD');
      expect(consoleLogStub).to.have.been.calledWith('- - --- ---- ----- --- --- --- ---- -- ----- --- ----------- ---');
    });
  });

  describe('Help Command', () => {
    it('should display all commands', async () => {
      await commands.help([]);
      expect(consoleLogStub).to.have.been.calledWith('\nCommandes disponibles :');
      expect(consoleLogStub).to.have.been.calledWith('-------------------');
    });

    it('should display specific command help', async () => {
      await commands.help(['calc']);
      expect(consoleLogStub).to.have.been.calledWith('\nAide pour la commande : calc');
    });

    it('should handle unknown command', async () => {
      await commands.help(['unknown']);
      expect(consoleErrorStub).to.have.been.calledWith('Commande inconnue : unknown');
    });
  });

  describe('Command Operators', () => {
    it('should handle && operator (success case)', async () => {
      const result = await executeCommandString('sort 1 2 3 && sort 4 5 6');
      expect(result).to.be.true;
      expect(consoleLogStub).to.have.been.calledWith('1 2 3');
      expect(consoleLogStub).to.have.been.calledWith('4 5 6');
    });

    it('should handle && operator (failure case)', async () => {
      const result = await executeCommandString('invalid_command && sort 4 5 6');
      expect(result).to.be.false;
      expect(consoleLogStub).to.not.have.been.calledWith('4 5 6');
    });

    it('should handle || operator (success case)', async () => {
      const result = await executeCommandString('sort 1 2 3 || sort 4 5 6');
      expect(result).to.be.true;
      expect(consoleLogStub).to.have.been.calledWith('1 2 3');
      expect(consoleLogStub).to.not.have.been.calledWith('4 5 6');
    });

    it('should handle || operator (failure case)', async () => {
      const result = await executeCommandString('invalid_command || sort 4 5 6');
      expect(result).to.be.true;
      expect(consoleLogStub).to.have.been.calledWith('4 5 6');
    });
  });

});
