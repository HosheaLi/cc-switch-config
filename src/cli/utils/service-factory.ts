/**
 * 共享服务工厂函数
 *
 * 从各 wizard 中提取的重复服务/存储创建逻辑。
 */

import { ProjectService, ApiService } from '../../lib/services/index.js';
import { ProjectIndex, ApiConfigStore, AppState, readConfig, writeConfig } from '../../lib/store/index.js';

export interface Services {
  projectIndex: ProjectIndex;
  apiConfigStore: ApiConfigStore;
  appState: AppState;
  projectService: ProjectService;
  apiService: ApiService;
}

export function createServices(): Services {
  const projectIndex = new ProjectIndex();
  const apiConfigStore = new ApiConfigStore();
  const appState = new AppState();
  const projectService = new ProjectService(projectIndex, appState);
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  return { projectIndex, apiConfigStore, appState, projectService, apiService };
}
