import Modal, { ModalBody, ModalCloseButton, ModalHeader, showErrorModal } from '..';
import { Accessor, Show, createEffect, createRoot, createSignal } from 'solid-js';

import { Codeberg, CodebergRepository } from '@app/modules/codeberg';
import * as Git from '@app/modules/git';
import { GitHub, GitHubRepository } from '@app/modules/github';
import { GitLab, GitLabProject } from '@app/modules/gitlab';
import { t } from '@app/modules/i18n';
import { showProviderModal } from '@app/modules/oauth';
import { createStoreListener } from '@app/stores';
import AccountStore, { Provider } from '@app/stores/account';
import ModalStore from '@app/stores/modal';
import Button from '@app/ui/Common/Button';
import EmptyState from '@app/ui/Common/EmptyState';
import FileSelect from '@app/ui/Common/FileSelect';
import Icon from '@app/ui/Common/Icon';
import TabView from '@app/ui/Common/TabView';
import TextArea from '@app/ui/Common/TextArea';
import * as logger from '@modules/logger';

import { RepoList } from './components';

import './index.scss';

const fs = window.Native.DANGEROUS__NODE__REQUIRE('fs');

const isEmpty = (path: string) => {
	const files = fs.readdirSync(path);

	return files.length === 0;
};

const fileValidator = (path: string) => {
	if (path.length === 0) return null;

	const exists = fs.existsSync(path);

	if (!exists) {
		return t('ui.filepicker.doesNotExist', {
			type: t('ui.filepicker.directory')
		});
	}

	let isDirectory = false;

	try {
		fs.opendirSync(path);

		isDirectory = true;
	} catch (e) {
		isDirectory = false;
	}

	if (!isDirectory)
		return t('ui.filepicker.isNot', {
			type: t('ui.filepicker.file'),
			expected: t('ui.filepicker.directory')
		});

	if (!isEmpty(path))
		return t('ui.filepicker.notEmpty', {
			type: t('ui.filepicker.directory')
		});

	return true;
};

export interface CloneModalProps {
	url?: string;
	tab?: 'github' | 'url';
}

const CloneModal = (props: CloneModalProps) => {
	const [response, setResponse] = createSignal<
		GitHubRepository[] | GitLabProject[] | CodebergRepository[] | null
	>(null);
	const [selected, setSelected] = createSignal<
		(GitHubRepository | GitLabProject | CodebergRepository) | null
	>();
	const [done, setDone] = createSignal(false);
	const [error, setError] = createSignal(false);
	const [dirError, setDirError] = createSignal<string>('');
	const [path, setPath] = createSignal('');
	const [url, setURL] = createSignal(props.url || '');
	const [tab, setTab] = createSignal<Provider>(props.tab || 'github');
	const account = createStoreListener([AccountStore], () =>
		AccountStore.getNormalisedAccount(tab() || 'github')
	);

	createEffect(() => {
		tab();

		setDone(false);
		setError(false);
		setResponse(null);

		try {
			switch (tab()) {
				case 'github':
					GitHub('user/repos')
						.get()
						.then((res) => {
							setDone(true);
							setResponse(res);
						})
						.catch((e) => {
							logger.error(e);
							setError(true);
						});
					break;
				case 'gitlab':
					GitLab('users/:userid/projects')
						.get(String(AccountStore.getAccountFor('gitlab')?.id))
						.then((res) => {
							setDone(true);
							setResponse(res);
						})
						.catch((e) => {
							logger.error(e);
							setError(true);
						});
					break;
				case 'codeberg':
					Codeberg('user/repos')
						.get()
						.then((res) => {
							setDone(true);
							setResponse(res);
						})
						.catch((e) => {
							logger.error(e);
							setError(true);
						});
					break;
				default:
					break;
			}
		} catch (e) {
			setError(true);
		}
	});

	const Url = () => (
		<div class="clone-modal__url">
			<label class="clone-modal__url__label">{t('modal.clone.urlLabel')}</label>
			<TextArea
				label={t('modal.clone.urlLabel')}
				value={url()}
				placeholder={t('modal.clone.urlPlaceholder', {
					provider: t(`modal.clone.providers.${AccountStore.last || 'github'}`) // TODO: hardcoding for now
				})}
				onChange={(val) => {
					setURL(val);
				}}
			/>
			<label class="clone-modal__url__label">{t('modal.clone.localLabel')}</label>
			<FileSelect
				input
				setError={setDirError}
				validate={fileValidator}
				initial={path()}
				properties={['openDirectory', 'createDirectory']}
				onSelect={setPath}
			/>
		</div>
	);

	const ProviderTab = (props: {
		close: () => void;
		response: Accessor<GitHubRepository[] | GitLabProject[] | CodebergRepository[] | null>;
	}) => (
		<Show
			when={account()}
			fallback={
				<EmptyState
					detail={t('modal.clone.auth')}
					hint={t('modal.clone.authHint')}
					icon="shield"
					actions={[
						{
							label: t('modal.clone.authButton'),
							type: 'brand',
							onClick: () => {
								showProviderModal();
							}
						}
					]}
				/>
			}
		>
			<Show
				when={!error()}
				fallback={
					<EmptyState detail={t('modal.clone.error')} hint={t('modal.clone.errorHint')} />
				}
			>
				<RepoList
					done={done()}
					provider={tab()}
					account={account()!}
					selected={selected}
					setSelected={setSelected}
					state={props.response()}
				/>
			</Show>
		</Show>
	);

	return (
		<Modal size={tab() === 'url' ? 'medium' : 'x-large'} dismissable id="clone">
			{(props) => (
				<>
					<ModalHeader
						title={
							<>
								{t('modal.clone.title')}
								<Show when={tab() !== 'url'}>
									<button
										classList={{
											'clone-modal__oauth': true
										}}
										onClick={showProviderModal}
									>
										<Show
											when={account()}
											fallback={
												<>
													<Icon name="shield" />
													{t('modal.clone.authenticate')}
												</>
											}
										>
											<img
												src={account()?.avatar}
												class="clone-modal__oauth__avatar"
											/>
											{account()?.username}
										</Show>
									</button>
								</Show>
							</>
						}
					>
						<ModalCloseButton {...props} />
					</ModalHeader>
					<ModalBody>
						<TabView
							signal={[tab, setTab]}
							views={[
								{
									label: t('modal.clone.providers.github'),
									value: 'github',
									element: <ProviderTab close={props.close} response={response} />
								},
								{
									label: t('modal.clone.providers.gitlab'),
									value: 'gitlab',
									element: <ProviderTab close={props.close} response={response} />
								},
								{
									label: t('modal.clone.providers.codeberg'),
									value: 'codeberg',
									element: <ProviderTab close={props.close} response={response} />
								},
								{
									label: t('modal.clone.providers.url'),
									value: 'url',
									element: <Url />
								}
							]}
						/>
					</ModalBody>
					<Show when={tab() === 'url' || selected()}>
						<div class="modal__footer clone-modal__footer">
							<Show when={tab() !== 'url'} fallback={<div />}>
								<FileSelect
									input
									setError={setDirError}
									validate={fileValidator}
									initial={path()}
									properties={['openDirectory', 'createDirectory']}
									onSelect={setPath}
								/>
							</Show>
							<div class="modal__footer__buttons">
								<Button
									label={t('modal.clone.clone')}
									type="default"
									onClick={() => {
										props.close();
									}}
								>
									{t('modal.cancel')}
								</Button>
								<Button
									label={t('modal.clone.clone')}
									type="brand"
									disabled={
										!!dirError() ||
										!(
											path() &&
											((tab() === 'url' && url()) ||
												(tab() !== 'url' && selected()))
										)
									}
									onClick={async () => {
										try {
											let cloneLike = url();

											switch (tab()) {
												case 'github':
													cloneLike = (selected() as GitHubRepository)
														.clone_url;
													break;
												case 'gitlab':
													cloneLike = (selected() as GitLabProject)
														.http_url_to_repo;
													break;
												case 'codeberg':
													cloneLike = (selected() as CodebergRepository)
														.clone_url;
													break;
												default:
													break;
											}

											if (!cloneLike) throw new Error('No clone URL');

											await Git.Clone(cloneLike, path());

											props.close();
										} catch (e) {
											logger.error(e);

											showErrorModal(e, 'error.git');
										}
									}}
								>
									{t('modal.clone.clone')}
								</Button>
							</div>
						</div>
					</Show>
				</>
			)}
		</Modal>
	);
};

export default CloneModal;

export const showCloneModal = (tab?: 'github' | 'url', url?: string) => {
	ModalStore.pushState(
		'clone',
		createRoot(() => <CloneModal url={url} tab={tab} />)
	);
};
