import { Repository } from '@stores/repository';

import { Git } from './core';

export const Push = async (repository: Repository) => {
	const res = await Git({
		directory: repository.path,
		command: 'push',
		args: ['origin', repository.branch]
	});

	return res;
};
