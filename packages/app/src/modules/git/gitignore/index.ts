import { refetchRepository } from '@app/modules/actions';
import { Repository } from '@app/stores/repository';

const path = window.Native.DANGEROUS__NODE__REQUIRE('path') as typeof import('path');
const fs = window.Native.DANGEROUS__NODE__REQUIRE('fs') as typeof import('fs');

export const addToGitignore = (repo: Repository, fileOrExt: string) => {
	const isExt = fileOrExt.startsWith('.');
	const gitignore = path.join(repo.path, '.gitignore');

	const newContent = isExt ? `**/*${fileOrExt}` : `\n${fileOrExt}`;

	if (fs.existsSync(gitignore)) {
		fs.appendFileSync(gitignore, newContent);
	} else {
		fs.writeFileSync(gitignore, newContent);
	}

	refetchRepository(repo);
};
