import { Show } from 'solid-js';

import { LogCommit } from '@app/modules/git/log';
import { t } from '@app/modules/i18n';
import { openExternal } from '@app/modules/shell';
import { renderDate } from '@app/modules/time';
import Menu from '@app/ui/Menu';
import { showErrorModal } from '@app/ui/Modal';
import * as Git from '@modules/git';
import { debug, error } from '@modules/logger';
import { createStoreListener } from '@stores/index';
import LocationStore from '@stores/location';

import './index.scss';

const clipboard = window.Native.DANGEROUS__NODE__REQUIRE(
	'electron:clipboard'
) as typeof import('electron').clipboard;

export default (props: LogCommit) => {
	const selected = createStoreListener([LocationStore], () => LocationStore.selectedCommit);

	return (
		<Menu
			items={[
				{
					type: 'item',
					label: t('sidebar.contextMenu.checkout'),
					onClick: async () => {
						try {
							await Git.Checkout(LocationStore.selectedRepository, props.hash);
						} catch (e) {
							showErrorModal(e, 'error.git');

							error('Failed to checkout commit', e);
						}
					}
				},
				{
					type: 'separator'
				},
				{
					label: t('sidebar.contextMenu.openRemote'),
					type: 'item',
					onClick: () => {
						const commitFormatsForProvider = (url: string) => {
							if (url.includes('github')) return `/commit/${props.hash}`;
							if (url.includes('gitlab')) return `/commit/${props.hash}`;
							if (url.includes('bitbucket')) return `/commits/${props.hash}`;
						};

						const remote = LocationStore.selectedRepository.remote.replace(
							/\.git$/,
							''
						);

						if (remote) {
							const url = `${remote}${commitFormatsForProvider(remote)}`;

							openExternal(url);
						}
					}
				},
				{
					label: t('sidebar.contextMenu.copySha'),
					type: 'item',
					onClick: () => {
						clipboard.writeText(props.hash);
					}
				}
			]}
		>
			<div
				aria-role="button"
				aria-label={t('sidebar.commit.label', {
					hash: props.message
				})}
				aria-selected={selected()?.hash === props.hash}
				class={`sidebar__commit ${selected()?.hash === props.hash ? 'active' : ''}`}
				data-id={props.hash}
				data-active={selected()?.hash === props.hash}
				onClick={async () => {
					LocationStore.setSelectedCommit(props);

					try {
						const commit = await Git.Show(
							LocationStore.selectedRepository.path,
							props.hash
						);

						LocationStore.setSelectedCommitFiles(commit);
						LocationStore.setSelectedCommitFile(commit.files[0]);
					} catch (e) {
						showErrorModal(e, 'error.git');

						error('Failed to show commit', e);
					}
				}}
				onKeyDown={async (e) => {
					if (e.key === 'Enter') {
						debug('Transitioning to commit', props.hash);
						LocationStore.setSelectedCommit(props);

						try {
							const commit = await Git.Show(
								LocationStore.selectedRepository.path,
								props.hash
							);

							LocationStore.setSelectedCommitFiles(commit);
							LocationStore.setSelectedCommitFile(commit.files[0]);
						} catch (e) {
							showErrorModal(e, 'error.git');

							error('Failed to show commit', e);
						}
					}
				}}
				tabIndex={0}
			>
				<div class="sidebar__commit__top">
					<div class="sidebar__commit__top__message">{props.message}</div>
					<div class="sidebar__commit__top__hash">{props.hash.substring(0, 7)}</div>
				</div>
				<div class="sidebar__commit__bottom">
					<div class="sidebar__commit__bottom__author">{props.author}</div>
					<div class="sidebar__commit__bottom__date">
						{renderDate(new Date(props.date).getTime())()}
					</div>
				</div>
				<Show when={props.insertions || props.deletions || props.files}>
					<div class="sidebar__commit__diff">
						<div class="sidebar__commit__diff__files">
							{props.files} {t('ui.filepicker.file', {}, props.files)}
						</div>
						<Show when={props.insertions}>
							<div class="sidebar__commit__diff__insertions">+{props.insertions}</div>
						</Show>
						<Show when={props.deletions}>
							<div class="sidebar__commit__diff__deletions">-{props.deletions}</div>
						</Show>
					</div>
				</Show>
			</div>
		</Menu>
	);
};
