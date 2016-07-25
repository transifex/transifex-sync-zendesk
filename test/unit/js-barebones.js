import main from '../../src/custard-moon';

describe('main', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(main, 'greet');
      main.greet();
    });

    it('should have been run once', () => {
      expect(main.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(main.greet).to.have.always.returned('hello');
    });
  });
});
