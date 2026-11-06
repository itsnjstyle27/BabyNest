/**
 * generateResponse caches replies. A reply depends on the whole conversation,
 * so it must only be reused when the whole conversation is the same.
 */

import {initLlama} from 'llama.rn';
import {generateResponse, loadModel} from '../src/model/model';

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
  releaseAllLlama: jest.fn(),
}));
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  exists: jest.fn(async () => true),
  stat: jest.fn(async () => ({size: 1024})),
}));
jest.mock('react-native-device-info', () => ({
  getTotalMemory: jest.fn(async () => 8 * 1024 ** 3),
  getUsedMemory: jest.fn(async () => 1024 ** 3),
}));
jest.mock('axios', () => ({get: jest.fn()}));

const question = {role: 'user', content: 'What should I focus on?'};

describe('generateResponse cache', () => {
  let completion;

  beforeAll(async () => {
    completion = jest.fn();
    initLlama.mockResolvedValue({completion});
    expect(await loadModel('model.gguf')).toBe(true);
  });

  beforeEach(() => {
    let count = 0;
    completion.mockReset();
    completion.mockImplementation(async () => {
      count += 1;
      return {text: `reply-${count}`};
    });
  });

  it('does not reuse a reply when an earlier message is different', async () => {
    const first = await generateResponse([{role: 'user', content: 'I am in week 12.'}, question]);
    const second = await generateResponse([{role: 'user', content: 'I am in week 32.'}, question]);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
    expect(completion).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a reply when the system prompt is different', async () => {
    const first = await generateResponse([{role: 'system', content: 'Trimester one.'}, question]);
    const second = await generateResponse([{role: 'system', content: 'Trimester three.'}, question]);

    expect(first).toBe('reply-1');
    expect(second).toBe('reply-2');
  });

  it('reuses the reply for the same conversation', async () => {
    const conversation = [{role: 'user', content: 'I am in week 20.'}, question];

    const first = await generateResponse(conversation);
    const second = await generateResponse([...conversation]);

    expect(second).toBe(first);
    expect(completion).toHaveBeenCalledTimes(1);
  });
});
