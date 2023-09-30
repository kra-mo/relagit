import { Show, For, createSignal } from 'solid-js';

import { GithubResponse } from './types';

import { openExternal } from '@app/modules/shell';
import { useI18n } from '@app/modules/i18n';

import Modal, { ModalBody, ModalCloseButton, ModalHeader } from '..';
import EmptyState from '@app/ui/Common/EmptyState';
import TextArea from '@app/ui/Common/TextArea';
import Button from '@app/ui/Common/Button';
import Icon from '@app/ui/Common/Icon';
import Layer from '@ui/Layer';

import './index.scss';

let languageFile;

fetch('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json')
	.then((r) => r.json())
	.then((r) => (languageFile = r));

const getLanguageColor = (language: string) => {
	return languageFile[language]?.color || '#000';
};

export default () => {
	const [response, setResponse] = createSignal<GithubResponse['user/repos'] | null>(null);
	const [searchQuery, setSearchQuery] = createSignal('');
	const [opened, setOpened] = createSignal<GithubResponse['user/repos'][number]>();
	const [error, setError] = createSignal(false);

	const t = useI18n();

	const makeSorter = () => {
		return (a: GithubResponse['user/repos'][0], b: GithubResponse['user/repos'][0]) => {
			if (a.stargazers_count > b.stargazers_count) {
				return -1;
			}

			if (a.stargazers_count < b.stargazers_count) {
				return 1;
			}

			return 0;
		};
	};

	const refetch = async () => {
		try {
			setError(false);

			const response = await fetch(`https://api.github.com/users/${searchQuery()}/repos`);

			if (response.status !== 200) {
				setResponse(null);
				setError(true);

				return;
			}

			setResponse((await response.json()) as GithubResponse['user/repos']);
		} catch (e) {
			setResponse(null);
			setError(true);
		}
	};

	return (
		<Modal size="x-large" dismissable transitions={Layer.Transitions.Fade}>
			{(props) => {
				return (
					<>
						<ModalHeader
							title={
								<>
									{t('modal.github.title')}
									<div class="github-modal__logo">
										<Icon name="mark-github" className="mark" />
										<Icon name="logo-github" className="logo" />
									</div>
								</>
							}
						>
							<ModalCloseButton {...props} />
						</ModalHeader>
						<ModalBody>
							<Show when={opened()}>
								<div class="github-modal__header">
									<Button
										onClick={() => {
											setOpened(null);
										}}
										label={t('modal.github.backToSearch')}
										type="default"
									>
										<Icon name="arrow-left" /> {t('modal.github.back')}
									</Button>
									<h2 class="github-modal__header__title">{opened().name}</h2>
									<div class="github-modal__header__social">
										<Show when={opened().stargazers_count}>
											<div class="github-modal__header__social__stars">
												<Icon name="star" />
												{opened().stargazers_count}
											</div>
										</Show>
										<Show when={opened().forks_count}>
											<div class="github-modal__header__social__forks">
												<Icon name="git-branch" />
												{opened().forks_count}
											</div>
											<Show when={opened().language}>
												<div class="github-modal__header__social__language">
													<div
														class="github-modal__header__social__language__indicator"
														style={{
															'background-color': getLanguageColor(
																opened().language
															)
														}}
													></div>
													{opened().language}
												</div>
											</Show>
										</Show>
									</div>
								</div>
								<div class="github-modal__details">
									<div class="github-modal__details__readme"></div>
									<div class="github-modal__details__info">
										<div class="github-modal__details__info__actions">
											<Button
												label="Clone repository"
												type="brand"
												onClick={() => {
													// TODO: Clone repo
												}}
											>
												<Icon name="git-pull-request" />{' '}
												{t('modal.github.clone')}
											</Button>
											<Button
												label={t('modal.github.viewOnGithub')}
												type="default"
												onClick={() => {
													openExternal(opened().html_url);
												}}
											>
												{t('modal.github.viewOnGithub')}
											</Button>
										</div>
									</div>
								</div>
							</Show>
							<Show when={!opened()}>
								<div class="github-modal__header">
									<TextArea
										placeholder={t('modal.github.searchPlaceholder')}
										value={searchQuery()}
										onChange={setSearchQuery}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												refetch();
											}
										}}
									/>
									<Button
										onClick={refetch}
										label={t('modal.github.search')}
										type="brand"
									>
										Search
									</Button>
								</div>
								<Show when={!response() && !error()}>
									<EmptyState
										detail={t('modal.github.loading')}
										hint={t('modal.github.loadingHint')}
									/>
								</Show>
								<Show when={error()}>
									<EmptyState
										detail={t('modal.github.error')}
										hint={t('modal.github.errorHint')}
									/>
								</Show>

								<Show when={response()}>
									<div class="github-modal__list">
										<For each={response().sort(makeSorter())}>
											{(repo) => (
												<div
													aria-role="button"
													aria-label={`${t('modal.github.clone')} ${
														repo.name
													}`}
													tabIndex={0}
													onClick={() => {
														setOpened(repo);
													}}
													class="github-modal__list__item"
												>
													<h3 class="github-modal__list__item__name">
														{repo.name}
													</h3>
													<p class="github-modal__list__item__description">
														{repo.description}
													</p>
													<div class="github-modal__list__item__details">
														<div class="github-modal__list__item__details__social">
															<Show when={repo.stargazers_count}>
																<div class="github-modal__list__item__details__social__stars">
																	<Icon name="star" />
																	{repo.stargazers_count}
																</div>
															</Show>
															<Show when={repo.forks_count}>
																<div class="github-modal__list__item__details__social__forks">
																	<Icon name="git-branch" />
																	{repo.forks_count}
																</div>
															</Show>
														</div>
														<Show when={repo.language}>
															<div class="github-modal__list__item__details__language">
																<div
																	class="github-modal__list__item__details__language__indicator"
																	style={{
																		'background-color':
																			getLanguageColor(
																				repo.language
																			)
																	}}
																></div>
																{repo.language}
															</div>
														</Show>
													</div>
												</div>
											)}
										</For>
									</div>
								</Show>
							</Show>
						</ModalBody>
					</>
				);
			}}
		</Modal>
	);
};
