import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  List, 
  ListItemButton, 
  ListItemText, 
  Chip, 
  TextField, 
  FormControl, 
  MenuItem, 
  InputAdornment, 
  Button, 
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Stack,
  Divider,
  Tabs,
  Tab,
  Badge,
  Checkbox,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import Select from '../../../../components/SafeSelect';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CategoryIcon from '@mui/icons-material/Category';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';

import { topicsService } from '../../topicsService';
import type { 
  AggregatedTopicGroup, 
  Topic, 
  ImportSheetResult, 
  GenerateTopicsResult,
  TopicPrompt
} from '../../vbplSuggestions.types';
import { useToastify } from '../../../../components/Toastify';
import { useAppSelector } from '../../../../app/store';
import { format, isValid } from 'date-fns';

interface Props {
  cartItems: any[];
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  cartMinimized: boolean;
  setCartMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleCart: (itemOrString: any) => void;
}

export default function VbplSuggestionsAggregatedTopics({
  cartItems,
  handleToggleCart
}: Props) {
  const { showToast } = useToastify();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN';
  const colSpanCount = 7 + (isAdmin ? 2 : 0);

  // State
  const [groups, setGroups] = useState<AggregatedTopicGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(''); // empty = all

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [totalTopics, setTotalTopics] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [sourceType, setSourceType] = useState<string>('all'); // all, manual, ai_generated
  const [minVolumeVal, setMinVolumeVal] = useState<string>('');
  const [sortVolume, setSortVolume] = useState<'desc' | 'asc' | 'none'>('none');

  // Sub-tabs & Selection & Actions
  const [subTab, setSubTab] = useState<'approved' | 'pending'>('approved');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [approving, setApproving] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // AI Generation Multi-select States
  const [selectedGenGroupIds, setSelectedGenGroupIds] = useState<string[]>([]);
  const [genCounts, setGenCounts] = useState<Record<string, number>>({});

  // Expanded Rows (Topic IDs)
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Modals
  const [openImportModal, setOpenImportModal] = useState<boolean>(false);
  const [importName, setImportName] = useState<string>('');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportSheetResult | null>(null);

  const [openGenerateModal, setOpenGenerateModal] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generateResult, setGenerateResult] = useState<GenerateTopicsResult | null>(null);

  // --- Prompts States ---
  const [promptsList, setPromptsList] = useState<TopicPrompt[]>([]);
  const [defaultPrompt, setDefaultPrompt] = useState<string>('');
  const [selectedPromptMode, setSelectedPromptMode] = useState<'default' | 'saved' | 'custom'>('default');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loadingPrompts, setLoadingPrompts] = useState<boolean>(false);

  // Prompts Manager CRUD Modal
  const [openPromptsManager, setOpenPromptsManager] = useState<boolean>(false);
  const [promptFormOpen, setPromptFormOpen] = useState<boolean>(false);
  const [promptFormMode, setPromptFormMode] = useState<'add' | 'edit'>('add');
  const [editingPromptId, setEditingPromptId] = useState<string>('');
  const [promptFormName, setPromptFormName] = useState<string>('');
  const [promptFormContent, setPromptFormContent] = useState<string>('');
  const [savingPrompt, setSavingPrompt] = useState<boolean>(false);

  // Fast Save Custom Prompt Dialog
  const [fastSaveOpen, setFastSaveOpen] = useState<boolean>(false);
  const [fastSaveName, setFastSaveName] = useState<string>('');
  const [savingFastPrompt, setSavingFastPrompt] = useState<boolean>(false);

  // Import sources history states
  const [importSources, setImportSources] = useState<ImportSheetResult[]>([]);
  const [loadingImportSources, setLoadingImportSources] = useState<boolean>(false);
  const [totalImportSources, setTotalImportSources] = useState<number>(0);
  const [importSourcesPage, setImportSourcesPage] = useState<number>(1);
  const [importSourcesLimit] = useState<number>(10);
  const [importSourcesTotalPages, setImportSourcesTotalPages] = useState<number>(1);
  const [searchImport, setSearchImport] = useState<string>('');

  // --- Group Actions State ---
  const [openGroupDialog, setOpenGroupDialog] = useState<boolean>(false);
  const [groupDialogMode, setGroupDialogMode] = useState<'add' | 'edit'>('add');
  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<AggregatedTopicGroup | null>(null);
  const [openDeleteGroupDialog, setOpenDeleteGroupDialog] = useState<boolean>(false);
  const [groupIdToDelete, setGroupIdToDelete] = useState<string>('');
  const [loadingGroupAction, setLoadingGroupAction] = useState<boolean>(false);

  // --- Topic Actions State ---
  const [openTopicDialog, setOpenTopicDialog] = useState<boolean>(false);
  const [topicDialogMode, setTopicDialogMode] = useState<'add' | 'edit'>('add');
  const [topicNameInput, setTopicNameInput] = useState<string>('');
  const [topicGroupIdInput, setTopicGroupIdInput] = useState<string>('');
  const [topicVolumeInput, setTopicVolumeInput] = useState<string>('');
  const [topicKeywordsInput, setTopicKeywordsInput] = useState<string>(''); // For comma-separated add
  const [selectedTopicForEdit, setSelectedTopicForEdit] = useState<Topic | null>(null);
  const [openDeleteTopicDialog, setOpenDeleteTopicDialog] = useState<boolean>(false);
  const [topicIdToDelete, setTopicIdToDelete] = useState<string>('');
  const [loadingTopicAction, setLoadingTopicAction] = useState<boolean>(false);
  const [updatingVolume, setUpdatingVolume] = useState<boolean>(false);

  // --- Bulk Add Topic State ---
  interface BulkAddItem {
    groupName: string;
    namesInput: string;
  }
  const [openBulkAddDialog, setOpenBulkAddDialog] = useState<boolean>(false);
  const [bulkAddItems, setBulkAddItems] = useState<BulkAddItem[]>([{ groupName: '', namesInput: '' }]);
  const [loadingBulkAdd, setLoadingBulkAdd] = useState<boolean>(false);
  const [bulkAddResult, setBulkAddResult] = useState<{
    requested: number;
    inserted: number;
    skipped: number;
    skippedNames: string[];
  } | null>(null);

  // --- Keyword Actions State ---
  const [openKeywordDialog, setOpenKeywordDialog] = useState<boolean>(false);
  const [keywordDialogMode, setKeywordDialogMode] = useState<'add' | 'edit'>('add');
  const [keywordTextInput, setKeywordTextInput] = useState<string>('');
  const [keywordVolumeInput, setKeywordVolumeInput] = useState<string>('');
  const [activeTopicForKeyword, setActiveTopicForKeyword] = useState<Topic | null>(null);
  const [selectedKeywordForEdit, setSelectedKeywordForEdit] = useState<any | null>(null);
  const [loadingKeywordAction, setLoadingKeywordAction] = useState<boolean>(false);

  // Group Handlers
  const handleOpenAddGroup = () => {
    setGroupDialogMode('add');
    setGroupNameInput('');
    setSelectedGroupForEdit(null);
    setOpenGroupDialog(true);
  };

  const handleOpenEditGroup = (group: AggregatedTopicGroup) => {
    setGroupDialogMode('edit');
    setGroupNameInput(group.name);
    setSelectedGroupForEdit(group);
    setOpenGroupDialog(true);
  };

  const handleSaveGroup = async () => {
    if (!groupNameInput.trim()) {
      showToast('Vui lòng nhập tên mảng', 'warning');
      return;
    }
    setLoadingGroupAction(true);
    try {
      if (groupDialogMode === 'add') {
        await topicsService.createGroup(groupNameInput.trim());
        showToast('Thêm mảng mới thành công!', 'success');
      } else if (groupDialogMode === 'edit' && selectedGroupForEdit) {
        const updated = await topicsService.updateGroup(selectedGroupForEdit.id, groupNameInput.trim());
        setGroups(prev => prev.map(g => g.id === selectedGroupForEdit.id ? { ...g, name: updated.name } : g));
        setTopics(prev => prev.map(t => t.group?.id === selectedGroupForEdit.id ? { ...t, group: { ...t.group, name: updated.name } } : t));
        showToast('Cập nhật mảng thành công!', 'success');
      }
      setOpenGroupDialog(false);
      await loadGroups();
      await loadPendingCount();
      loadTopics(page);
    } catch (err: any) {
      console.error('Lỗi lưu mảng:', err);
      showToast(err.response?.data?.message || 'Không thể thực hiện thao tác trên mảng', 'danger');
    } finally {
      setLoadingGroupAction(false);
    }
  };

  const handleOpenDeleteGroup = (id: string) => {
    setGroupIdToDelete(id);
    setOpenDeleteGroupDialog(true);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupIdToDelete) return;
    setLoadingGroupAction(true);
    try {
      await topicsService.deleteGroup(groupIdToDelete);
      showToast('Xoá mảng thành công!', 'success');
      setGroups(prev => prev.filter(g => g.id !== groupIdToDelete));
      setOpenDeleteGroupDialog(false);
      await loadGroups();
      await loadPendingCount();
      if (selectedGroupId === groupIdToDelete) {
        setSelectedGroupId('');
      } else {
        loadTopics(page);
      }
    } catch (err: any) {
      console.error('Lỗi xoá mảng:', err);
      showToast(err.response?.data?.message || 'Không thể xoá mảng này', 'danger');
    } finally {
      setLoadingGroupAction(false);
    }
  };

  const handleRefreshGroupVolume = async (id: string) => {
    try {
      showToast('Đang cập nhật volume mảng...', 'info');
      const res = await topicsService.refreshGroupVolume(id);
      setGroups(prev => prev.map(g => g.id === id ? { ...g, volume: res.volume } : g));
      showToast(`Cập nhật volume thành công: ${res.volume.toLocaleString()}`, 'success');
    } catch (err: any) {
      console.error('Lỗi cập nhật volume mảng:', err);
      showToast(err.response?.data?.message || 'Lỗi cập nhật volume mảng', 'danger');
    }
  };

  const handleRefreshAllGroupsVolume = async () => {
    const adminGroups = groups.filter(g => g.id !== '');
    if (adminGroups.length === 0) return;
    try {
      showToast('Đang cập nhật volume cho tất cả mảng...', 'info');
      const res = await topicsService.refreshGroupsVolume(adminGroups.map(g => g.id));
      showToast(`Đã cập nhật volume cho ${res.updated} mảng thành công!`, 'success');
      loadGroups();
    } catch (err: any) {
      console.error('Lỗi cập nhật volume các mảng:', err);
      showToast(err.response?.data?.message || 'Lỗi cập nhật volume các mảng', 'danger');
    }
  };

  // Topic Handlers
  const handleOpenAddTopic = () => {
    setTopicDialogMode('add');
    setTopicNameInput('');
    setTopicGroupIdInput(selectedGroupId || '');
    setTopicVolumeInput('');
    setTopicKeywordsInput('');
    setSelectedTopicForEdit(null);
    setOpenTopicDialog(true);
  };

  const handleOpenEditTopic = (topic: Topic) => {
    setTopicDialogMode('edit');
    setTopicNameInput(topic.name);
    setTopicGroupIdInput(topic.group?.id || '');
    setTopicVolumeInput(topic.volume !== null ? String(topic.volume) : '');
    setTopicKeywordsInput('');
    setSelectedTopicForEdit(topic);
    setOpenTopicDialog(true);
  };

  const handleSaveTopic = async () => {
    if (!topicNameInput.trim()) {
      showToast('Vui lòng nhập tên chủ đề', 'warning');
      return;
    }
    if (!topicGroupIdInput) {
      showToast('Vui lòng chọn mảng', 'warning');
      return;
    }
    setLoadingTopicAction(true);
    try {
      const vol = topicVolumeInput.trim() ? parseInt(topicVolumeInput) : undefined;
      if (topicDialogMode === 'add') {
        const keywordsArray = topicKeywordsInput
          .split(',')
          .map(k => k.trim())
          .filter(Boolean)
          .map(k => ({ keyword: k }));
          
        await topicsService.createTopic(topicNameInput.trim(), topicGroupIdInput, vol, keywordsArray);
        showToast('Thêm chủ đề mới thành công!', 'success');
      } else if (topicDialogMode === 'edit' && selectedTopicForEdit) {
        await topicsService.updateTopic(selectedTopicForEdit.id, {
          name: topicNameInput.trim(),
          groupId: topicGroupIdInput,
          volume: vol
        });
        showToast('Cập nhật chủ đề thành công!', 'success');
      }
      setOpenTopicDialog(false);
      await loadGroups();
      await loadPendingCount();
      loadTopics(topicDialogMode === 'add' ? 1 : page);
    } catch (err: any) {
      console.error('Lỗi lưu chủ đề:', err);
      showToast(err.response?.data?.message || 'Không thể lưu chủ đề', 'danger');
    } finally {
      setLoadingTopicAction(false);
    }
  };

  const handleOpenDeleteTopic = (id: string) => {
    setTopicIdToDelete(id);
    setOpenDeleteTopicDialog(true);
  };

  const handleConfirmDeleteTopic = async () => {
    if (!topicIdToDelete) return;
    setLoadingTopicAction(true);
    try {
      await topicsService.deleteTopic(topicIdToDelete);
      showToast('Xoá chủ đề thành công!', 'success');
      setOpenDeleteTopicDialog(false);
      const remainingOnPage = topics.length - 1;
      const targetPage = (remainingOnPage <= 0 && page > 1) ? page - 1 : page;
      await loadGroups();
      await loadPendingCount();
      loadTopics(targetPage);
    } catch (err: any) {
      console.error('Lỗi xoá chủ đề:', err);
      showToast(err.response?.data?.message || 'Không thể xoá chủ đề', 'danger');
    } finally {
      setLoadingTopicAction(false);
    }
  };

  const handleOpenBulkAddTopic = () => {
    const currentGroup = groups.find(g => g.id === selectedGroupId);
    const initialGroupName = (currentGroup && currentGroup.id !== '') ? currentGroup.name : '';
    setBulkAddItems([{ groupName: initialGroupName, namesInput: '' }]);
    setBulkAddResult(null);
    setOpenBulkAddDialog(true);
  };

  const handleAddBulkBlock = () => {
    if (bulkAddItems.length >= 50) {
      showToast('Tối đa chỉ được nhập 50 mảng', 'warning');
      return;
    }
    setBulkAddItems(prev => [...prev, { groupName: '', namesInput: '' }]);
  };

  const handleRemoveBulkBlock = (index: number) => {
    if (bulkAddItems.length <= 1) return;
    setBulkAddItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleBulkBlockChange = (index: number, field: keyof BulkAddItem, value: string) => {
    setBulkAddItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleSaveBulkTopics = async () => {
    if (bulkAddItems.length === 0) {
      showToast('Vui lòng thêm ít nhất 1 mảng', 'warning');
      return;
    }
    if (bulkAddItems.length > 50) {
      showToast('Số lượng mảng tối đa là 50', 'warning');
      return;
    }

    const validatedItems: { groupName: string; names: string[] }[] = [];

    for (let i = 0; i < bulkAddItems.length; i++) {
      const block = bulkAddItems[i];
      const trimmedGroupName = block.groupName.trim();

      if (!trimmedGroupName) {
        showToast(`Tên mảng ở Phần #${i + 1} không được để trống`, 'warning');
        return;
      }
      if (trimmedGroupName.length > 200) {
        showToast(`Tên mảng ở Phần #${i + 1} không được vượt quá 200 ký tự`, 'warning');
        return;
      }

      const names = block.namesInput
        .split('\n')
        .map(n => n.trim())
        .filter(Boolean);

      if (names.length === 0) {
        showToast(`Vui lòng nhập ít nhất một chủ đề ở Phần #${i + 1}`, 'warning');
        return;
      }
      if (names.length > 500) {
        showToast(`Phần #${i + 1} vượt quá giới hạn 500 chủ đề (hiện có ${names.length})`, 'warning');
        return;
      }

      for (let j = 0; j < names.length; j++) {
        const name = names[j];
        if (name.length > 200) {
          showToast(`Chủ đề "${name.substring(0, 20)}..." ở Phần #${i + 1} vượt quá 200 ký tự`, 'warning');
          return;
        }
      }

      validatedItems.push({
        groupName: trimmedGroupName,
        names
      });
    }

    setLoadingBulkAdd(true);
    setBulkAddResult(null);
    try {
      const res = await topicsService.createTopicsBulk(validatedItems);
      setBulkAddResult(res);
      showToast(res.message || `Đã thêm mới thành công ${res.inserted} chủ đề!`, 'success');
      await loadGroups();
      await loadPendingCount();
      loadTopics(1);
    } catch (err: any) {
      console.error('Lỗi thêm chủ đề hàng loạt:', err);
      const errorData = err.response?.data;
      if (errorData?.code === 'VALIDATION_ERROR') {
        showToast(`Lỗi xác thực dữ liệu: ${errorData.message || 'vui lòng kiểm tra lại các ràng buộc'}`, 'danger');
      } else if (errorData?.code === 'ACCESS_DENIED' || err.response?.status === 401) {
        showToast('Bạn không có quyền ADMIN để thực hiện thao tác này', 'danger');
      } else {
        showToast(errorData?.message || 'Lỗi khi thêm chủ đề hàng loạt', 'danger');
      }
    } finally {
      setLoadingBulkAdd(false);
    }
  };

  const handleRefreshTopicVolume = async (id: string) => {
    try {
      showToast('Đang cập nhật volume chủ đề...', 'info');
      const res = await topicsService.refreshTopicVolume(id);
      setTopics(prev => prev.map(t => t.id === id ? { ...t, volume: res.volume } : t));
      showToast(`Cập nhật volume thành công: ${res.volume.toLocaleString()}`, 'success');
    } catch (err: any) {
      console.error('Lỗi cập nhật volume chủ đề:', err);
      showToast(err.response?.data?.message || 'Lỗi cập nhật volume chủ đề', 'danger');
    }
  };

  const handleRefreshSelectedTopicsVolume = async () => {
    if (selectedTopicIds.length === 0) return;
    setUpdatingVolume(true);
    try {
      showToast('Đang cập nhật volume các chủ đề đã chọn...', 'info');
      const res = await topicsService.refreshTopicsVolume(selectedTopicIds);
      showToast(`Đã cập nhật volume cho ${res.updated} chủ đề thành công!`, 'success');
      loadTopics(page);
      setSelectedTopicIds([]);
    } catch (err: any) {
      console.error('Lỗi cập nhật volume hàng loạt:', err);
      showToast(err.response?.data?.message || 'Lỗi cập nhật volume', 'danger');
    } finally {
      setUpdatingVolume(false);
    }
  };

  const handleDeleteSelectedTopics = async () => {
    if (selectedTopicIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedTopicIds.length} chủ đề đã chọn?`)) return;
    setUpdatingVolume(true);
    try {
      let deletedCount = 0;
      for (const id of selectedTopicIds) {
        await topicsService.deleteTopic(id);
        deletedCount++;
      }
      showToast(`Đã xoá thành công ${deletedCount} chủ đề!`, 'success');
      setSelectedTopicIds([]);
      await loadGroups();
      await loadPendingCount();
      loadTopics(1);
    } catch (err: any) {
      console.error('Lỗi xoá chủ đề hàng loạt:', err);
      showToast(err.response?.data?.message || 'Lỗi xoá chủ đề', 'danger');
    } finally {
      setUpdatingVolume(false);
    }
  };

  // Keyword Handlers
  const handleOpenAddKeyword = (topic: Topic) => {
    setActiveTopicForKeyword(topic);
    setKeywordDialogMode('add');
    setKeywordTextInput('');
    setKeywordVolumeInput('');
    setSelectedKeywordForEdit(null);
    setOpenKeywordDialog(true);
  };

  const handleOpenEditKeyword = (topic: Topic, keyword: any) => {
    setActiveTopicForKeyword(topic);
    setKeywordDialogMode('edit');
    setKeywordTextInput(keyword.keyword);
    setKeywordVolumeInput(keyword.volume !== null && keyword.volume !== undefined ? String(keyword.volume) : '');
    setSelectedKeywordForEdit(keyword);
    setOpenKeywordDialog(true);
  };

  const handleSaveKeyword = async () => {
    if (!keywordTextInput.trim()) {
      showToast('Vui lòng nhập từ khoá', 'warning');
      return;
    }
    if (!activeTopicForKeyword) return;
    setLoadingKeywordAction(true);
    try {
      const vol = keywordVolumeInput.trim() ? parseInt(keywordVolumeInput) : undefined;
      if (keywordDialogMode === 'add') {
        const updatedTopic = await topicsService.addKeyword(activeTopicForKeyword.id, keywordTextInput.trim(), vol);
        setTopics(prev => prev.map(t => t.id === activeTopicForKeyword.id ? updatedTopic : t));
        showToast('Thêm từ khoá con thành công!', 'success');
      } else if (keywordDialogMode === 'edit' && selectedKeywordForEdit) {
        const updatedTopic = await topicsService.updateKeyword(
          activeTopicForKeyword.id,
          selectedKeywordForEdit.id,
          { keyword: keywordTextInput.trim(), volume: vol }
        );
        setTopics(prev => prev.map(t => t.id === activeTopicForKeyword.id ? updatedTopic : t));
        showToast('Cập nhật từ khoá thành công!', 'success');
      }
      setOpenKeywordDialog(false);
    } catch (err: any) {
      console.error('Lỗi lưu từ khoá:', err);
      showToast(err.response?.data?.message || 'Không thể lưu từ khoá', 'danger');
    } finally {
      setLoadingKeywordAction(false);
    }
  };

  const handleOpenDeleteKeyword = async (topic: Topic, keyword: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá từ khoá "${keyword.keyword}"?`)) return;
    try {
      const updatedTopic = await topicsService.deleteKeyword(topic.id, keyword.id);
      setTopics(prev => prev.map(t => t.id === topic.id ? updatedTopic : t));
      showToast('Xoá từ khoá con thành công!', 'success');
    } catch (err: any) {
      console.error('Lỗi xoá từ khoá:', err);
      showToast(err.response?.data?.message || 'Không thể xoá từ khoá', 'danger');
    }
  };

  const handleRefreshSingleKeywordVolume = async () => {
    if (!activeTopicForKeyword || !selectedKeywordForEdit) return;
    setLoadingKeywordAction(true);
    try {
      const res = await topicsService.refreshKeywordVolume(activeTopicForKeyword.id, selectedKeywordForEdit.id);
      setKeywordVolumeInput(String(res.volume));
      setTopics(prev => prev.map(t => {
        if (t.id !== activeTopicForKeyword.id) return t;
        return {
          ...t,
          seedKeywords: t.seedKeywords.map(kw => kw.id === selectedKeywordForEdit.id ? { ...kw, volume: res.volume } : kw)
        };
      }));
      showToast(`Cập nhật volume thành công: ${res.volume.toLocaleString()}`, 'success');
    } catch (err: any) {
      console.error('Lỗi cập nhật volume từ khoá đơn lẻ:', err);
      showToast(err.response?.data?.message || 'Không thể cập nhật volume từ khoá', 'danger');
    } finally {
      setLoadingKeywordAction(false);
    }
  };

  const handleRefreshAllKeywordsVolume = async (topicId: string) => {
    try {
      showToast('Đang cập nhật volume cho tất cả từ khoá...', 'info');
      const updatedTopic = await topicsService.refreshAllKeywordsVolume(topicId);
      setTopics(prev => prev.map(t => t.id === topicId ? updatedTopic : t));
      showToast('Đã cập nhật volume cho tất cả từ khoá thành công!', 'success');
    } catch (err: any) {
      console.error('Lỗi cập nhật volume tất cả từ khoá:', err);
      showToast(err.response?.data?.message || 'Lỗi cập nhật volume', 'danger');
    }
  };

  // Load Groups
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await topicsService.getGroups();
      setGroups(data || []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách mảng:', err);
      showToast(err.response?.data?.message || 'Không thể tải danh sách mảng', 'danger');
    } finally {
      setLoadingGroups(false);
    }
  };

  // Load Pending Count
  const loadPendingCount = async () => {
    try {
      const data = await topicsService.getTopics({ status: 'pending', limit: 1 });
      setPendingCount(data.total || 0);
    } catch (err) {
      console.error('Lỗi tải số lượng chủ đề chờ duyệt:', err);
    }
  };

  // Load Topics
  const loadTopics = async (targetPage = page) => {
    setLoadingTopics(true);
    try {
      const data = await topicsService.getTopics({
        groupId: selectedGroupId || undefined,
        sourceType: subTab === 'pending' ? undefined : (sourceType === 'all' ? undefined : (sourceType as 'manual' | 'ai_generated')),
        search: search.trim() || undefined,
        status: subTab,
        minVolume: minVolumeVal ? parseInt(minVolumeVal) || undefined : undefined,
        sortVolume: sortVolume !== 'none' ? sortVolume : undefined,
        page: targetPage,
        limit
      });
      setTopics(data.items || []);
      setTotalTopics(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err: any) {
      console.error('Lỗi tải danh sách chủ đề:', err);
      showToast(err.response?.data?.message || 'Không thể tải danh sách chủ đề', 'danger');
    } finally {
      setLoadingTopics(false);
    }
  };

  // Load Import Sources
  const loadImportSources = async (targetPage = importSourcesPage) => {
    if (!isAdmin) return;
    setLoadingImportSources(true);
    try {
      const data = await topicsService.getImportSources({
        page: targetPage,
        limit: importSourcesLimit,
        search: searchImport.trim() || undefined
      });
      setImportSources(data.items || []);
      setTotalImportSources(data.total || 0);
      setImportSourcesTotalPages(data.totalPages || 1);
      setImportSourcesPage(data.page || 1);
    } catch (err: any) {
      console.error('Lỗi tải lịch sử import:', err);
    } finally {
      setLoadingImportSources(false);
    }
  };

  // Lifecycle
  useEffect(() => {
    loadGroups();
    loadImportSources(1);
    loadPendingCount();
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedTopicIds([]);
    loadTopics(1);
    setExpandedTopicId(null);
  }, [selectedGroupId, sourceType, subTab, sortVolume, limit]);

  // Debounced search trigger for topics
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadTopics(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [search, minVolumeVal]);

  // Debounced search trigger for import history
  useEffect(() => {
    const timer = setTimeout(() => {
      setImportSourcesPage(1);
      loadImportSources(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchImport]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    loadTopics(value);
    setExpandedTopicId(null);
  };

  const handleImportPageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setImportSourcesPage(value);
    loadImportSources(value);
  };

  // Action Import
  const handleImport = async () => {
    if (!importName.trim()) {
      showToast('Vui lòng nhập tên lần import', 'warning');
      return;
    }
    if (!sheetUrl.trim()) {
      showToast('Vui lòng nhập link Google Sheet', 'warning');
      return;
    }
    if (!sheetUrl.startsWith('https://docs.google.com/spreadsheets/')) {
      showToast('Link Google Sheet không đúng định dạng', 'warning');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const result = await topicsService.importFromSheet(importName.trim(), sheetUrl.trim());
      setImportResult(result);
      showToast('Import dữ liệu từ Google Sheet thành công!', 'success');
      await loadGroups();
      await loadPendingCount();
      loadTopics(1);
      loadImportSources(1);
    } catch (err: any) {
      console.error('Lỗi import:', err);
      showToast(err.response?.data?.message || 'Lỗi khi import dữ liệu từ Google Sheet', 'danger');
    } finally {
      setImporting(false);
    }
  };

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = topics.map((n) => n.id);
      setSelectedTopicIds(newSelecteds);
    } else {
      setSelectedTopicIds([]);
    }
  };

  const handleSelectRow = (event: React.MouseEvent<unknown>, id: string) => {
    event.stopPropagation();
    const selectedIndex = selectedTopicIds.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedTopicIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedTopicIds.slice(1));
    } else if (selectedIndex === selectedTopicIds.length - 1) {
      newSelected = newSelected.concat(selectedTopicIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedTopicIds.slice(0, selectedIndex),
        selectedTopicIds.slice(selectedIndex + 1)
      );
    }

    setSelectedTopicIds(newSelected);
  };

  // Action Approve
  const handleApproveSelected = async () => {
    if (selectedTopicIds.length === 0) return;
    setApproving(true);
    try {
      const result = await topicsService.approveTopics(selectedTopicIds);
      showToast(result.message || `Đã duyệt thành công ${result.approved} chủ đề`, 'success');
      setSelectedTopicIds([]);
      await loadPendingCount();
      await loadGroups();
      const remainingOnPage = topics.length - selectedTopicIds.length;
      const targetPage = (remainingOnPage <= 0 && page > 1) ? page - 1 : page;
      loadTopics(targetPage);
    } catch (err: any) {
      console.error('Lỗi duyệt chủ đề:', err);
      showToast(err.response?.data?.message || 'Không thể duyệt các chủ đề đã chọn', 'danger');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveSingleTopic = async (topicId: string) => {
    setApproving(true);
    try {
      const result = await topicsService.approveTopics([topicId]);
      showToast(result.message || 'Đã duyệt chủ đề thành công!', 'success');
      setSelectedTopicIds(prev => prev.filter(id => id !== topicId));
      await loadPendingCount();
      await loadGroups();
      const remainingOnPage = topics.length - 1;
      const targetPage = (remainingOnPage <= 0 && page > 1) ? page - 1 : page;
      loadTopics(targetPage);
    } catch (err: any) {
      console.error('Lỗi duyệt chủ đề đơn lẻ:', err);
      showToast(err.response?.data?.message || 'Không thể duyệt chủ đề này', 'danger');
    } finally {
      setApproving(false);
    }
  };

  // Action Export to Sheet
  const handleExportToSheet = async () => {
    setExporting(true);
    try {
      const result = await topicsService.exportTopicsToSheet();
      if (result.exportedTopics === 0) {
        showToast(result.message || 'Không có dữ liệu mới nào cần xuất', 'info');
      } else {
        const viewLink = result.url || result.sheetUrl;
        const msg = (
          <span>
            {result.message || `Đã xuất ${result.exportedTopics} chủ đề mới lên Sheet thành công!`}
            {viewLink && (
              <a
                href={viewLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#ffffff',
                  textDecoration: 'underline',
                  fontWeight: 700,
                  marginLeft: '8px'
                }}
              >
                Xem trên Sheet ↗
              </a>
            )}
          </span>
        );
        showToast(msg, 'success');
      }
    } catch (err: any) {
      console.error('Lỗi xuất sheet:', err);
      showToast(err.response?.data?.message || 'Lỗi khi xuất chủ đề ra Google Sheet', 'danger');
    } finally {
      setExporting(false);
    }
  };

  // Action Generate
  // Action Generate
  const handleGenerate = async () => {
    if (selectedGenGroupIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 mảng', 'warning');
      return;
    }
    if (selectedGenGroupIds.length > 20) {
      showToast('Tối đa chỉ được chọn 20 mảng', 'warning');
      return;
    }

    // Prompt payload options setup & validation
    let options: { promptId?: string; customPrompt?: string } = {};

    if (selectedPromptMode === 'saved') {
      if (!selectedPromptId) {
        showToast('Vui lòng chọn một Prompt đã lưu', 'warning');
        return;
      }
      options.promptId = selectedPromptId;
    } else if (selectedPromptMode === 'custom') {
      if (!customPrompt.trim()) {
        showToast('Vui lòng nhập nội dung prompt tùy chỉnh', 'warning');
        return;
      }
      if (customPrompt.length > 5000) {
        showToast('Nội dung prompt tùy chỉnh không được vượt quá 5000 ký tự', 'warning');
        return;
      }
      options.customPrompt = customPrompt.trim();
    }

    const items = selectedGenGroupIds.map(groupId => ({
      groupId,
      count: genCounts[groupId] || 10
    }));

    setGenerating(true);
    setGenerateResult(null);
    setOpenGenerateModal(false);
    showToast('Đang tiến hành tạo chủ đề bằng AI ở chế độ nền...', 'info');

    try {
      const result = await topicsService.generateTopics(items, options);
      setGenerateResult(result);
      showToast(result.message || `Đã tạo thêm ${result.generated}/${result.requested} chủ đề mới thành công!`, 'success');
      
      // Auto switch to pending sub-tab
      setSubTab('pending');
      setSelectedTopicIds([]);
      await loadPendingCount();
      await loadGroups();
      loadTopics(1);
    } catch (err: any) {
      console.error('Lỗi generate:', err);
      showToast(err.response?.data?.message || 'Lỗi khi gọi AI tạo chủ đề', 'danger');
    } finally {
      setGenerating(false);
    }
  };

  // --- Prompts Handlers ---
  const loadPromptsData = async () => {
    setLoadingPrompts(true);
    try {
      const data = await topicsService.getPrompts();
      setPromptsList(data.prompts || []);
      if (data.default && data.default.content) {
        setDefaultPrompt(data.default.content);
      } else {
        const def = await topicsService.getDefaultPrompt();
        setDefaultPrompt(def.content);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải prompts:', err);
      showToast('Không thể tải danh sách prompt', 'danger');
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleLoadDefaultAsBase = () => {
    if (defaultPrompt) {
      setCustomPrompt(defaultPrompt);
      showToast('Đã nạp mẫu mặc định làm nền', 'success');
    }
  };

  const handleFastSavePrompt = async () => {
    if (!fastSaveName.trim()) {
      showToast('Tên prompt không được để trống', 'warning');
      return;
    }
    if (fastSaveName.length > 200) {
      showToast('Tên prompt không được quá 200 ký tự', 'warning');
      return;
    }
    setSavingFastPrompt(true);
    try {
      const newPrompt = await topicsService.createPrompt(fastSaveName.trim(), customPrompt.trim());
      showToast('Lưu prompt làm mẫu thành công!', 'success');
      
      const updatedList = [newPrompt, ...promptsList];
      setPromptsList(updatedList);
      
      setSelectedPromptMode('saved');
      setSelectedPromptId(newPrompt.id);
      
      setFastSaveOpen(false);
    } catch (err: any) {
      console.error('Lỗi lưu prompt nhanh:', err);
      const msg = err.response?.data?.message || '';
      if (msg.includes('DUPLICATE_TOPIC_PROMPT')) {
        showToast('Tên prompt đã tồn tại, vui lòng chọn tên khác', 'danger');
      } else {
        showToast(msg || 'Lỗi khi lưu prompt mẫu', 'danger');
      }
    } finally {
      setSavingFastPrompt(false);
    }
  };

  const handleOpenAddPromptForm = () => {
    setPromptFormMode('add');
    setEditingPromptId('');
    setPromptFormName('');
    setPromptFormContent('');
    setPromptFormOpen(true);
  };

  const handleOpenEditPromptForm = (prompt: TopicPrompt) => {
    setPromptFormMode('edit');
    setEditingPromptId(prompt.id);
    setPromptFormName(prompt.name);
    setPromptFormContent(prompt.content);
    setPromptFormOpen(true);
  };

  const handleSavePromptForm = async () => {
    if (!promptFormName.trim()) {
      showToast('Tên prompt không được để trống', 'warning');
      return;
    }
    if (promptFormName.length > 200) {
      showToast('Tên prompt không được quá 200 ký tự', 'warning');
      return;
    }
    if (!promptFormContent.trim()) {
      showToast('Nội dung prompt không được để trống', 'warning');
      return;
    }
    if (promptFormContent.length > 5000) {
      showToast('Nội dung prompt không được quá 5000 ký tự', 'warning');
      return;
    }

    setSavingPrompt(true);
    try {
      if (promptFormMode === 'add') {
        const newPrompt = await topicsService.createPrompt(promptFormName.trim(), promptFormContent.trim());
        setPromptsList(prev => [newPrompt, ...prev]);
        showToast('Tạo prompt mới thành công!', 'success');
        
        if (!selectedPromptId) {
          setSelectedPromptId(newPrompt.id);
        }
      } else {
        const updated = await topicsService.updatePrompt(editingPromptId, {
          name: promptFormName.trim(),
          content: promptFormContent.trim()
        });
        setPromptsList(prev => prev.map(p => p.id === editingPromptId ? updated : p));
        showToast('Cập nhật prompt thành công!', 'success');
      }
      setPromptFormOpen(false);
    } catch (err: any) {
      console.error('Lỗi lưu form prompt:', err);
      const msg = err.response?.data?.message || '';
      if (msg.includes('DUPLICATE_TOPIC_PROMPT')) {
        showToast('Tên prompt đã tồn tại, vui lòng chọn tên khác', 'danger');
      } else if (msg.includes('TOPIC_PROMPT_NOT_FOUND')) {
        showToast('Prompt không tồn tại hoặc đã bị xóa', 'danger');
      } else if (msg.includes('EMPTY_UPDATE')) {
        showToast('Không có thay đổi nào để cập nhật', 'warning');
      } else {
        showToast(msg || 'Lỗi khi lưu prompt', 'danger');
      }
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa prompt này? Thao tác này không thể hoàn tác.')) {
      return;
    }

    setSavingPrompt(true);
    try {
      await topicsService.deletePrompt(id);
      setPromptsList(prev => prev.filter(p => p.id !== id));
      showToast('Đã xóa prompt thành công!', 'success');
      
      if (selectedPromptId === id) {
        setSelectedPromptId('');
      }
    } catch (err: any) {
      console.error('Lỗi xóa prompt:', err);
      const msg = err.response?.data?.message || '';
      if (msg.includes('TOPIC_PROMPT_NOT_FOUND')) {
        showToast('Prompt không tồn tại hoặc đã bị xóa từ trước', 'danger');
      } else {
        showToast(msg || 'Lỗi khi xóa prompt', 'danger');
      }
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleOpenGenerateModal = () => {
    setSelectedGenGroupIds([]);
    setGenCounts({});
    setGenerateResult(null);
    setSelectedPromptMode('default');
    setSelectedPromptId('');
    setCustomPrompt('');
    setOpenGenerateModal(true);
    loadPromptsData();
  };

  const safeFormatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
  };

  const safeFormatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm') : '-';
  };

  const handleToggleRow = (topicId: string) => {
    setExpandedTopicId(prev => prev === topicId ? null : topicId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Header & Admin Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Chủ đề tổng hợp
        </Typography>
        {isAdmin && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PlaylistAddIcon />}
              onClick={handleOpenBulkAddTopic}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Thêm hàng loạt
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                setImportName('');
                setSheetUrl('');
                setImportResult(null);
                setOpenImportModal(true);
              }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Import từ Google Sheet
            </Button>
            <Button
              variant="outlined"
              color="success"
              disabled={exporting}
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DescriptionIcon />}
              onClick={handleExportToSheet}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Xuất chủ đề mới ra Sheet
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={generating}
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleOpenGenerateModal}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              {generating ? 'AI đang tạo...' : 'Tạo thêm chủ đề bằng AI'}
            </Button>
          </Stack>
        )}
      </Box>

      {/* 2. Content Layout */}
      <Grid container spacing={3}>
        {/* Sidebar Mảng (API 1) */}
        <Grid size={{ xs: 3, sm: 3, md: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              📁 Danh sách Mảng
            </Typography>
            {isAdmin && (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Thêm mảng mới">
                  <IconButton size="small" onClick={handleOpenAddGroup} sx={{ color: 'primary.main', p: 0.5 }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cập nhật Volume tất cả mảng">
                  <IconButton size="small" onClick={handleRefreshAllGroupsVolume} sx={{ color: 'success.main', p: 0.5 }}>
                    <SyncIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Box>
          <Paper 
            variant="outlined" 
            sx={{ 
              borderRadius: '12px', 
              maxHeight: 500, 
              overflowY: 'auto',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <List disablePadding>
              <ListItemButton 
                selected={selectedGroupId === ''} 
                onClick={() => setSelectedGroupId('')}
                sx={{ py: 1.5 }}
              >
                <ListItemText 
                  primary="Tất cả mảng" 
                  primaryTypographyProps={{ variant: 'body2', fontWeight: selectedGroupId === '' ? 800 : 500 }} 
                />
              </ListItemButton>
              <Divider />
              {loadingGroups ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : groups.length === 0 ? (
                <Typography variant="caption" sx={{ display: 'block', p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Chưa có mảng dữ liệu nào.
                </Typography>
              ) : (
                groups.map((g) => (
                  <ListItemButton
                    key={g.id}
                    selected={selectedGroupId === g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    sx={{ 
                      py: 1, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      '& .group-actions': { display: 'none' },
                      '&:hover .group-actions': { display: 'flex' },
                      '&:hover .group-badge': { display: 'none' }
                    }}
                  >
                    <ListItemText
                      primary={g.name}
                      secondary={g.volume !== null ? `Vol: ${g.volume.toLocaleString()}` : 'Vol: -'}
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: selectedGroupId === g.id ? 800 : 500,
                        noWrap: true,
                        title: g.name
                      }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      sx={{ mr: 1, flexGrow: 1, minWidth: 0 }}
                    />
                    <Box className="group-badge" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={g.topicCount} 
                        size="small" 
                        color={selectedGroupId === g.id ? 'primary' : 'default'}
                        sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700 }}
                      />
                    </Box>
                    {isAdmin && (
                      <Box 
                        className="group-actions" 
                        onClick={(e) => e.stopPropagation()}
                        sx={{ alignItems: 'center', gap: 0.25 }}
                      >
                        <Tooltip title="Cập nhật Volume">
                          <IconButton size="small" onClick={() => handleRefreshGroupVolume(g.id)} sx={{ p: 0.5, color: 'success.main' }}>
                            <SyncIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sửa tên mảng">
                          <IconButton size="small" onClick={() => handleOpenEditGroup(g)} sx={{ p: 0.5, color: 'primary.main' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xoá mảng">
                          <IconButton size="small" onClick={() => handleOpenDeleteGroup(g.id)} sx={{ p: 0.5, color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </ListItemButton>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Bảng Chủ đề (API 2) */}
        <Grid size={{ xs: 9, sm: 9, md: 9 }} sx={{ minWidth: 0, flexShrink: 1 }}>
          {/* Sub-tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={subTab} 
              onChange={(_, newValue: 'approved' | 'pending') => {
                setSubTab(newValue);
              }}
              aria-label="topic sub tabs"
            >
              <Tab 
                value="approved" 
                label="Tất cả" 
                sx={{ textTransform: 'none', fontWeight: 700 }} 
              />
              <Tab 
                value="pending" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Chờ duyệt</span>
                    {pendingCount > 0 && (
                      <Badge 
                        badgeContent={pendingCount} 
                        color="error" 
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            fontSize: '0.65rem', 
                            height: 16, 
                            minWidth: 16, 
                            fontWeight: 700 
                          } 
                        }}
                      />
                    )}
                  </Box>
                }
                sx={{ textTransform: 'none', fontWeight: 700 }} 
              />
            </Tabs>
          </Box>

          {/* Filters Top Bar */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 2, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              {subTab === 'pending' ? (
                <>
                  <Grid size={{ xs: 12, sm: isAdmin ? 6 : 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Tìm kiếm theo tên chủ đề..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {isAdmin && (
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={topics.length === 0}
                        onClick={() => {
                          if (selectedTopicIds.length === topics.length && topics.length > 0) {
                            setSelectedTopicIds([]);
                          } else {
                            setSelectedTopicIds(topics.map(t => t.id));
                          }
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                      >
                        {selectedTopicIds.length === topics.length && topics.length > 0 ? 'Bỏ chọn' : 'Chọn tất cả'}
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={selectedTopicIds.length === 0 || approving}
                        onClick={handleApproveSelected}
                        startIcon={approving ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                      >
                        Duyệt đã chọn ({selectedTopicIds.length})
                      </Button>
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Tìm kiếm theo tên chủ đề..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="all">Tất cả Nguồn</MenuItem>
                        <MenuItem value="manual">Thủ công</MenuItem>
                        <MenuItem value="ai_generated">AI tạo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
 
              {/* Row 2: minVolume & sortVolume */}
              <Grid size={{ xs: 12 }} sx={{ pt: '8px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Volume tối thiểu:
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={minVolumeVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseInt(val) >= 0) {
                          setMinVolumeVal(val);
                        }
                      }}
                      placeholder="Nhập volume..."
                      inputProps={{ min: 0 }}
                      sx={{ 
                        width: 130,
                        '& .MuiInputBase-input': { 
                          height: '32px',
                          padding: '0 10px',
                          boxSizing: 'border-box',
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Box>
 
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Sắp xếp:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={sortVolume}
                        onChange={(e) => setSortVolume(e.target.value as any)}
                        sx={{ height: 32, fontSize: '0.875rem' }}
                      >
                        <MenuItem value="none">Mặc định (Mới nhất)</MenuItem>
                        <MenuItem value="desc">Volume giảm dần</MenuItem>
                        <MenuItem value="asc">Volume tăng dần</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
 
          {/* Table Container Batch Actions */}
          {isAdmin && selectedTopicIds.length > 0 && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                bgcolor: 'action.selected', 
                borderRadius: '8px',
                borderColor: 'divider'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Đã chọn {selectedTopicIds.length} chủ đề
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<SyncIcon />}
                  disabled={updatingVolume}
                  onClick={handleRefreshSelectedTopicsVolume}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Cập nhật Volume
                </Button>
                {subTab === 'pending' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={approving}
                    onClick={handleApproveSelected}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Duyệt chủ đề
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  disabled={updatingVolume}
                  onClick={handleDeleteSelectedTopics}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Xoá
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => setSelectedTopicIds([])}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Huỷ
                </Button>
              </Stack>
            </Paper>
          )}
 
          {/* Table Container */}
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              borderRadius: '12px', 
              borderColor: 'divider', 
              overflowX: 'auto',
              width: '100%',
              minHeight: 400
            }}
          >
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  {isAdmin && (
                    <TableCell padding="checkbox" width="50">
                      <Checkbox
                        indeterminate={selectedTopicIds.length > 0 && selectedTopicIds.length < topics.length}
                        checked={topics.length > 0 && selectedTopicIds.length === topics.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell width="40"></TableCell>
                  <TableCell sx={{ fontWeight: 800 }} width="30%">Tên chủ đề</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} width="12%">Volume</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} width="18%">Mảng</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} width="12%">Nguồn</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} width="13%">Từ khóa gốc</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} width="15%">Ngày tạo</TableCell>
                  {isAdmin && (
                    <TableCell sx={{ fontWeight: 800 }} width="15%">Thao tác</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingTopics ? (
                  <TableRow>
                    <TableCell colSpan={colSpanCount} align="center" sx={{ py: 12 }}>
                      <CircularProgress size={30} sx={{ mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Đang tải danh sách chủ đề...</Typography>
                    </TableCell>
                  </TableRow>
                ) : topics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpanCount} align="center" sx={{ py: 12 }}>
                      <Typography variant="body2" color="text.secondary">Không tìm thấy chủ đề nào khớp bộ lọc.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  topics.map((t) => {
                    const isExpanded = expandedTopicId === t.id;
                    const isItemSelected = selectedTopicIds.indexOf(t.id) !== -1;
                    return (
                      <React.Fragment key={t.id}>
                        <TableRow 
                          hover 
                          selected={isExpanded || isItemSelected}
                          onClick={(e) => {
                            if (isAdmin) {
                              handleSelectRow(e, t.id);
                            }
                          }}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          {isAdmin && (
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isItemSelected}
                                onChange={(e) => handleSelectRow(e as any, t.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell onClick={(e) => { e.stopPropagation(); handleToggleRow(t.id); }}>
                            <IconButton size="small">
                              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{t.name}</TableCell>
                          <TableCell>{t.volume !== null ? t.volume.toLocaleString() : '-'}</TableCell>
                          <TableCell sx={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{t.group ? t.group.name : <Typography variant="caption" color="text.secondary">Chưa phân mảng</Typography>}</TableCell>
                          <TableCell>
                            <Chip
                              label={t.sourceType === 'manual' ? 'Thủ công' : 'AI tạo'}
                              color={t.sourceType === 'manual' ? 'info' : 'warning'}
                              size="small"
                              variant="light"
                              sx={{ fontWeight: 800, height: 20, fontSize: '0.675rem' }}
                            />
                          </TableCell>
                          <TableCell>{t.seedKeywords ? t.seedKeywords.length : 0}</TableCell>
                          <TableCell>{safeFormatDate(t.createdAt)}</TableCell>
                          {isAdmin && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Stack direction="row" spacing={0.5}>
                                {subTab === 'pending' && (
                                  <Tooltip title="Duyệt chủ đề">
                                    <IconButton size="small" onClick={() => handleApproveSingleTopic(t.id)} sx={{ color: 'info.main', p: 0.5 }}>
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Cập nhật Volume">
                                  <IconButton size="small" onClick={() => handleRefreshTopicVolume(t.id)} sx={{ color: 'success.main', p: 0.5 }}>
                                    <SyncIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Sửa chủ đề">
                                  <IconButton size="small" onClick={() => handleOpenEditTopic(t)} sx={{ color: 'primary.main', p: 0.5 }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xoá chủ đề">
                                  <IconButton size="small" onClick={() => handleOpenDeleteTopic(t.id)} sx={{ color: 'error.main', p: 0.5 }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          )}
                        </TableRow>
 
                        {/* Expandable row detail */}
                        <TableRow>
                          <TableCell colSpan={colSpanCount} style={{ paddingBottom: 0, paddingTop: 0, borderBottom: isExpanded ? '1px solid rgba(224, 224, 224, 1)' : 'none' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PlaylistAddIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                                    Danh sách Từ khóa gốc (Seed Keywords)
                                  </Typography>
                                  {isAdmin && (
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenAddKeyword(t)}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', py: 0.25, fontSize: '0.75rem' }}
                                      >
                                        Thêm từ khoá
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        color="success"
                                        size="small"
                                        startIcon={<SyncIcon />}
                                        onClick={() => handleRefreshAllKeywordsVolume(t.id)}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', py: 0.25, fontSize: '0.75rem' }}
                                      >
                                        Cập nhật Volume tất cả
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                                {!t.seedKeywords || t.seedKeywords.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary" sx={{ py: 1, pl: 3.5, fontStyle: 'italic' }}>
                                    Chưa có từ khóa gốc
                                  </Typography>
                                ) : (
                                  <Box sx={{ pl: 3.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, py: 1 }}>
                                    {t.seedKeywords.map((kw, idx) => {
                                      const isInCart = cartItems.some(item => item.name === kw.keyword);
                                      const isKeywordAdmin = isAdmin;
                                      const chipLabel = `${kw.keyword} (${kw.volume !== null && kw.volume !== undefined ? kw.volume.toLocaleString() : '-'})`;
                                      return (
                                        <Tooltip key={kw.id || idx} title={isKeywordAdmin ? "Click để chỉnh sửa hoặc cập nhật volume" : (isInCart ? "Xoá khỏi giỏ hàng" : "Thêm vào giỏ hàng")}>
                                          <Chip
                                            label={chipLabel}
                                            onClick={() => {
                                              if (isKeywordAdmin) {
                                                handleOpenEditKeyword(t, kw);
                                              } else {
                                                handleToggleCart({ name: kw.keyword, avg: kw.volume });
                                              }
                                            }}
                                            onDelete={isKeywordAdmin ? () => handleOpenDeleteKeyword(t, kw) : undefined}
                                            icon={!isKeywordAdmin ? (isInCart ? <RemoveShoppingCartIcon sx={{ fontSize: '14px !important' }} /> : <AddShoppingCartIcon sx={{ fontSize: '14px !important' }} />) : undefined}
                                            color={isInCart ? 'primary' : 'default'}
                                            variant={isInCart ? 'filled' : 'outlined'}
                                            sx={{ 
                                              fontWeight: 600, 
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              '&:hover': {
                                                borderColor: 'primary.main',
                                                color: 'primary.main'
                                              }
                                            }}
                                          />
                                        </Tooltip>
                                      );
                                    })}
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
 
          {/* Pagination & Limit Selector */}
          {totalTopics > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 3, 
              flexWrap: 'wrap', 
              gap: 2 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Số bản ghi mỗi trang:
                </Typography>
                <Select
                  size="small"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  sx={{ 
                    height: 32, 
                    minWidth: 80,
                    '& .MuiSelect-select': { py: 0.5 }
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
                <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                  (Tổng số: {totalTopics})
                </Typography>
              </Box>

              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                />
              )}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* 2.5. Section Lịch sử import (Admin Only) */}
      {isAdmin && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            borderRadius: '16px', 
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Lịch sử Import từ Google Sheet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Danh sách các đợt import dữ liệu mảng, chủ đề và từ khoá gốc đã thực hiện.
              </Typography>
            </Box>
            
            <TextField
              size="small"
              placeholder="Tìm theo tên lần import..."
              value={searchImport}
              onChange={(e) => setSearchImport(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Tên lần import</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Đường dẫn Google Sheet</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">Mảng mới</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">Chủ đề mới</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">Chủ đề trùng</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">Từ khoá gốc</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Ngày import</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingImportSources ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">Đang tải lịch sử...</Typography>
                    </TableCell>
                  </TableRow>
                ) : importSources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">Không tìm thấy lịch sử import nào.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  importSources.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.sheetUrl ? (
                          <a 
                            href={item.sheetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}
                          >
                            Mở Google Sheet ↗
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {item.groupsCreated}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {item.topicsCreated}
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary' }}>
                        {item.topicsSkippedExisting}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                        {item.seedKeywordsImported}
                      </TableCell>
                      <TableCell>
                        {safeFormatDateTime(item.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Import Sources Pagination */}
          {importSourcesTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Pagination
                count={importSourcesTotalPages}
                page={importSourcesPage}
                onChange={handleImportPageChange}
                color="primary"
                shape="rounded"
                size="small"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* 3. Modal Import Google Sheet */}
      <Dialog 
        open={openImportModal} 
        onClose={() => !importing && setOpenImportModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon sx={{ color: 'primary.main' }} />
          Import dữ liệu từ Google Sheet
        </DialogTitle>
        <DialogContent dividers>
          {importing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Đang tải dữ liệu và phân tích Google Sheet... Vui lòng đợi trong giây lát
              </Typography>
            </Box>
          ) : importResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                ✓ Nhập dữ liệu thành công!
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '8px' }}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary">Số mảng mới được tạo:</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{importResult.groupsCreated}</Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary">Số chủ đề mới được thêm:</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{importResult.topicsCreated}</Typography>
                  </Grid>

                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary">Số chủ đề bị trùng (bỏ qua):</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{importResult.topicsSkippedExisting}</Typography>
                  </Grid>

                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary">Tổng số từ khóa gốc đã import:</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{importResult.seedKeywordsImported}</Typography>
                  </Grid>

                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary">Số dòng bị bỏ qua do thiếu Mảng:</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{importResult.rowsSkippedNoGroup}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Đặt tên gợi nhớ cho lần import này và dán link bảng tính Google Sheet của bạn vào đây. Đảm bảo file được cấu hình quyền chia sẻ là <strong>"Bất kỳ ai có liên kết đều có thể xem" (Anyone with the link can view)</strong>.
              </Typography>
              <TextField
                fullWidth
                label="Tên lần import"
                variant="outlined"
                value={importName}
                onChange={(e) => setImportName(e.target.value.slice(0, 200))}
                placeholder="Ví dụ: Sheet luật sư T6/2026"
                size="small"
                required
                error={!importName.trim()}
                helperText={!importName.trim() ? "Tên lần import là bắt buộc (tối đa 200 ký tự)" : ""}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Đường dẫn Google Sheet"
                variant="outlined"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                size="small"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {!importing && (
            <Button 
              onClick={() => setOpenImportModal(false)} 
              sx={{ textTransform: 'none', fontWeight: 700 }}
              variant="text"
              color="inherit"
            >
              Đóng
            </Button>
          )}
          {!importing && !importResult && (
            <Button
              onClick={handleImport}
              variant="contained"
              color="primary"
              disabled={!importName.trim() || !sheetUrl.trim()}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Bắt đầu Import
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 4. Modal Generate Topics AI */}
      <Dialog 
        open={openGenerateModal} 
        onClose={() => !generating && setOpenGenerateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
          Tạo thêm chủ đề bằng AI
        </DialogTitle>
        <DialogContent dividers>
          {generating ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                AI đang suy nghĩ và tự động phân loại chủ đề mới... Quá trình này có thể tốn 15-30 giây.
              </Typography>
            </Box>
          ) : generateResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                ✓ Đã tạo thành công {generateResult.generated}/{generateResult.requested} chủ đề mới!
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, maxHeight: 300, overflowY: 'auto', borderRadius: '8px' }}>
                {generateResult.topics && generateResult.topics.length > 0 ? (
                  <TableContainer component={Box}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Tên chủ đề</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Mảng</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Volume</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {generateResult.topics.map((t, idx) => (
                          <TableRow key={t.id || idx} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{t.name}</TableCell>
                            <TableCell>{t.group ? t.group.name : '-'}</TableCell>
                            <TableCell align="right">{t.volume !== null && t.volume !== undefined ? t.volume.toLocaleString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
                    Không có chủ đề mới nào được tạo thêm (do trùng hoặc giới hạn).
                  </Typography>
                )}
              </Paper>
            </Box>
          ) : (
            <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                AI sẽ phân tích các mảng được chọn để tìm và sinh thêm những chủ đề độc đáo (không trùng với các chủ đề đã tồn tại trong hệ thống).
              </Typography>
              
              <FormControl fullWidth size="small">
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Chọn mảng cần tạo chủ đề (Tối đa 20 mảng):
                </Typography>

                {selectedGenGroupIds.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    {selectedGenGroupIds.map((groupId) => {
                      const groupName = groups.find(g => g.id === groupId)?.name || groupId;
                      return (
                        <Chip 
                          key={groupId} 
                          label={groupName} 
                          size="small" 
                          color="primary"
                          onDelete={() => {
                            setSelectedGenGroupIds(prev => prev.filter(id => id !== groupId));
                          }}
                          sx={{ 
                            borderRadius: '6px',
                            fontWeight: 600,
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            color: 'primary.main',
                            border: '1px solid rgba(25, 118, 210, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.12)'
                            }
                          }}
                        />
                      );
                    })}
                  </Box>
                )}

                <Select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value as string;
                    if (!val) return;
                    if (selectedGenGroupIds.length >= 20) {
                      showToast('Tối đa chỉ chọn được 20 mảng', 'warning');
                      return;
                    }
                    if (!selectedGenGroupIds.includes(val)) {
                      setSelectedGenGroupIds(prev => [...prev, val]);
                      setGenCounts(prev => ({
                        ...prev,
                        [val]: prev[val] || 10
                      }));
                    }
                  }}
                  displayEmpty
                  renderValue={() => (
                    <em style={{ color: '#aaa', fontStyle: 'normal' }}>
                      {selectedGenGroupIds.length === 0 ? 'Chọn mảng...' : 'Chọn thêm mảng...'}
                    </em>
                  )}
                  MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                >
                  <MenuItem value="" disabled>
                    <em>{selectedGenGroupIds.length === 0 ? 'Chọn mảng...' : 'Chọn thêm mảng...'}</em>
                  </MenuItem>
                  {groups
                    .filter(g => g.id && !selectedGenGroupIds.includes(g.id))
                    .map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {selectedGenGroupIds.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Nhập số lượng chủ đề cho mỗi mảng (1-50):
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedGenGroupIds.map((groupId) => {
                      const groupName = groups.find(g => g.id === groupId)?.name || groupId;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={groupId}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ flexGrow: 1, fontWeight: 600, noWrap: true, textOverflow: 'ellipsis', overflow: 'hidden' }} title={groupName}>
                              {groupName}
                            </Typography>
                            <TextField
                              type="number"
                              size="small"
                              value={genCounts[groupId] || 10}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
                                setGenCounts(prev => ({ ...prev, [groupId]: val }));
                              }}
                              inputProps={{ min: 1, max: 50 }}
                              sx={{ width: 80 }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SettingsIcon fontSize="small" color="primary" />
                  Cấu hình Prompt gợi ý chủ đề:
                </Typography>

                <RadioGroup
                  row
                  value={selectedPromptMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'default' | 'saved' | 'custom';
                    setSelectedPromptMode(mode);
                    if (mode === 'saved' && promptsList.length > 0 && !selectedPromptId) {
                      setSelectedPromptId(promptsList[0].id);
                    }
                  }}
                  sx={{ mb: 2, gap: 2 }}
                >
                  <FormControlLabel
                    value="default"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Mẫu mặc định
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="saved"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Chọn từ prompt đã lưu
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Tự soạn prompt mới
                      </Typography>
                    }
                  />
                </RadioGroup>

                {/* --- 1. Mode Default --- */}
                {selectedPromptMode === 'default' && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: '8px',
                      borderStyle: 'dashed'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                      Xem trước Prompt mặc định:
                    </Typography>
                    {loadingPrompts ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={20} />
                      </Box>
                    ) : (
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1,
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          maxHeight: '120px',
                          overflowY: 'auto',
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '4px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}
                      >
                        {defaultPrompt || 'Chưa tải được prompt mặc định.'}
                      </Box>
                    )}
                  </Paper>
                )}

                {/* --- 2. Mode Saved --- */}
                {selectedPromptMode === 'saved' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedPromptId}
                          onChange={(e) => setSelectedPromptId(e.target.value as string)}
                          displayEmpty
                        >
                          {promptsList.length === 0 ? (
                            <MenuItem value="" disabled>
                              Không có prompt nào được lưu
                            </MenuItem>
                          ) : (
                            promptsList.map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.name}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                      
                      {isAdmin && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => setOpenPromptsManager(true)}
                          sx={{ textTransform: 'none', height: '40px', px: 2, whiteSpace: 'nowrap', borderRadius: '8px', fontWeight: 600 }}
                        >
                          Quản lý
                        </Button>
                      )}
                    </Box>

                    {selectedPromptId && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          bgcolor: 'action.hover',
                          borderRadius: '8px'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                          Xem trước prompt đã chọn:
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1,
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            maxHeight: '120px',
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '4px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}
                        >
                          {promptsList.find(p => p.id === selectedPromptId)?.content || 'Nội dung trống.'}
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}

                {/* --- 3. Mode Custom --- */}
                {selectedPromptMode === 'custom' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleLoadDefaultAsBase}
                        disabled={loadingPrompts || !defaultPrompt}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '12px' }}
                      >
                        Dùng mẫu mặc định làm nền
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          onClick={() => {
                            if (!customPrompt.trim()) {
                              showToast('Vui lòng nhập nội dung prompt trước khi lưu', 'warning');
                              return;
                            }
                            if (customPrompt.length > 5000) {
                              showToast('Nội dung prompt vượt quá 5000 ký tự', 'warning');
                              return;
                            }
                            setFastSaveName('');
                            setFastSaveOpen(true);
                          }}
                          sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '12px' }}
                        >
                          Lưu prompt này làm mẫu
                        </Button>
                      )}
                    </Box>

                    <TextField
                      multiline
                      rows={5}
                      fullWidth
                      variant="outlined"
                      placeholder="Nhập nội dung prompt tùy chỉnh để hướng dẫn AI sinh chủ đề..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value.slice(0, 5000))}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          borderRadius: '8px'
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography variant="caption" color={customPrompt.length >= 5000 ? 'error' : 'text.secondary'}>
                        {customPrompt.length}/5000 ký tự
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          {!generating && (
            <Button 
              onClick={() => setOpenGenerateModal(false)} 
              sx={{ textTransform: 'none', fontWeight: 700 }}
              variant="text"
              color="inherit"
            >
              Đóng
            </Button>
          )}
          {!generating && !generateResult && (
            <Button
              onClick={handleGenerate}
              variant="contained"
              color="primary"
              disabled={selectedGenGroupIds.length === 0}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Bắt đầu tạo
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 5. Modal Thêm/Sửa Mảng */}
      <Dialog 
        open={openGroupDialog} 
        onClose={() => !loadingGroupAction && setOpenGroupDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {groupDialogMode === 'add' ? 'Thêm mảng mới' : 'Chỉnh sửa tên mảng'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <TextField
            fullWidth
            label="Tên mảng"
            variant="outlined"
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            placeholder="Nhập tên mảng... Ví dụ: Luật doanh nghiệp"
            size="small"
            required
            disabled={loadingGroupAction}
            error={!groupNameInput.trim()}
            helperText={!groupNameInput.trim() ? "Tên mảng không được để trống" : ""}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenGroupDialog(false)} 
            disabled={loadingGroupAction}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            color="primary"
            disabled={loadingGroupAction || !groupNameInput.trim()}
            startIcon={loadingGroupAction ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. Modal Xác nhận Xoá Mảng */}
      <Dialog
        open={openDeleteGroupDialog}
        onClose={() => !loadingGroupAction && setOpenDeleteGroupDialog(false)}
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Xác nhận xoá mảng
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc chắn muốn xoá mảng này? Thao tác này có thể ảnh hưởng đến các chủ đề thuộc mảng này (họ sẽ ở trạng thái "Chưa phân mảng").
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenDeleteGroupDialog(false)} 
            disabled={loadingGroupAction}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDeleteGroup}
            variant="contained"
            color="error"
            disabled={loadingGroupAction}
            startIcon={loadingGroupAction ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Xác nhận xoá
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Modal Thêm/Sửa Chủ đề */}
      <Dialog 
        open={openTopicDialog} 
        onClose={() => !loadingTopicAction && setOpenTopicDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {topicDialogMode === 'add' ? 'Thêm chủ đề mới' : 'Chỉnh sửa chủ đề'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Tên chủ đề"
            variant="outlined"
            value={topicNameInput}
            onChange={(e) => setTopicNameInput(e.target.value)}
            placeholder="Nhập tên chủ đề... Ví dụ: Thủ tục thành lập công ty"
            size="small"
            required
            disabled={loadingTopicAction}
            error={!topicNameInput.trim()}
            helperText={!topicNameInput.trim() ? "Tên chủ đề không được để trống" : ""}
          />
          <FormControl fullWidth size="small" required error={!topicGroupIdInput}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
              Mảng liên quan
            </Typography>
            <Select
              value={topicGroupIdInput}
              onChange={(e) => setTopicGroupIdInput(e.target.value)}
              displayEmpty
              disabled={loadingTopicAction}
            >
              <MenuItem value="" disabled>Chọn mảng...</MenuItem>
              {groups.filter(g => g.id !== '').map((g) => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Volume (Lượt tìm kiếm)"
            variant="outlined"
            type="number"
            value={topicVolumeInput}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || parseInt(val) >= 0) {
                setTopicVolumeInput(val);
              }
            }}
            placeholder="Nhập volume ban đầu (nếu có)"
            size="small"
            disabled={loadingTopicAction}
          />
          
          {topicDialogMode === 'add' && (
            <TextField
              fullWidth
              label="Từ khóa gốc (seed keywords)"
              variant="outlined"
              multiline
              rows={2}
              value={topicKeywordsInput}
              onChange={(e) => setTopicKeywordsInput(e.target.value)}
              placeholder="Nhập danh sách từ khóa gốc phân cách bằng dấu phẩy (,), ví dụ: thành lập doanh nghiệp, hồ sơ công ty..."
              size="small"
              disabled={loadingTopicAction}
              helperText="Các từ khóa con này sẽ được tạo cùng chủ đề."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenTopicDialog(false)} 
            disabled={loadingTopicAction}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveTopic}
            variant="contained"
            color="primary"
            disabled={loadingTopicAction || !topicNameInput.trim() || !topicGroupIdInput}
            startIcon={loadingTopicAction ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Thêm chủ đề hàng loạt */}
      <Dialog
        open={openBulkAddDialog}
        onClose={() => !loadingBulkAdd && setOpenBulkAddDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Thêm chủ đề hàng loạt
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {bulkAddItems.map((item, index) => {
            const topicCount = item.namesInput.split('\n').filter(n => n.trim()).length;
            return (
              <Box 
                key={index} 
                sx={{ 
                  p: 2, 
                  border: '1px dashed', 
                  borderColor: 'primary.main', 
                  borderRadius: '8px', 
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    Phần #{index + 1}
                  </Typography>
                  {bulkAddItems.length > 1 && (
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleRemoveBulkBlock(index)}
                      disabled={loadingBulkAdd}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <FormControl fullWidth size="small" required error={!item.groupName.trim()}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.secondary', fontSize: '0.775rem' }}>
                    Chọn mảng liên quan
                  </Typography>
                  <Select
                    value={item.groupName}
                    onChange={(e) => handleBulkBlockChange(index, 'groupName', e.target.value)}
                    displayEmpty
                    disabled={loadingBulkAdd}
                  >
                    <MenuItem value="" disabled>Chọn mảng...</MenuItem>
                    {groups.filter(g => g.id !== '').map((g) => {
                      const isSelectedElsewhere = bulkAddItems.some((other, idx) => idx !== index && other.groupName === g.name);
                      if (isSelectedElsewhere) return null;
                      return <MenuItem key={g.id} value={g.name}>{g.name}</MenuItem>;
                    })}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Danh sách chủ đề (Mỗi dòng 1 chủ đề)"
                  variant="outlined"
                  multiline
                  rows={4}
                  size="small"
                  required
                  value={item.namesInput}
                  onChange={(e) => handleBulkBlockChange(index, 'namesInput', e.target.value)}
                  placeholder={"Nhập danh sách chủ đề...\nVí dụ:\nDịch vụ thành lập công ty\nDịch vụ kế toán trọn gói"}
                  disabled={loadingBulkAdd}
                  helperText={`Số lượng chủ đề: ${topicCount}/500. Mỗi dòng tối đa 200 ký tự.`}
                  error={topicCount > 500}
                />
              </Box>
            );
          })}

          {bulkAddItems.length < 50 && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddBulkBlock}
              disabled={loadingBulkAdd}
              sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Thêm mảng khác
            </Button>
          )}

          {bulkAddResult && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Kết quả thêm hàng loạt:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Tổng số gửi:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{bulkAddResult.requested}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="success.main">Thêm thành công:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{bulkAddResult.inserted}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="warning.main">Bị trùng bỏ qua:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>{bulkAddResult.skipped}</Typography>
                </Grid>
              </Grid>

              {bulkAddResult.skippedNames && bulkAddResult.skippedNames.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                    Danh sách chủ đề đã tồn tại (bỏ qua):
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '4px',
                      p: 1,
                      bgcolor: 'background.paper',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    {bulkAddResult.skippedNames.map((name, i) => (
                      <div key={i}>• {name}</div>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenBulkAddDialog(false)}
            disabled={loadingBulkAdd}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            {bulkAddResult ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            onClick={handleSaveBulkTopics}
            variant="contained"
            color="primary"
            disabled={loadingBulkAdd || bulkAddItems.some(item => !item.groupName.trim() || !item.namesInput.trim())}
            startIcon={loadingBulkAdd ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Thêm hàng loạt
          </Button>
        </DialogActions>
      </Dialog>

      {/* 8. Modal Xác nhận Xoá Chủ đề */}
      <Dialog
        open={openDeleteTopicDialog}
        onClose={() => !loadingTopicAction && setOpenDeleteTopicDialog(false)}
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Xác nhận xoá chủ đề
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc chắn muốn xoá chủ đề này? Thao tác này sẽ xoá hoàn toàn chủ đề và các từ khoá con thuộc về nó.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenDeleteTopicDialog(false)} 
            disabled={loadingTopicAction}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDeleteTopic}
            variant="contained"
            color="error"
            disabled={loadingTopicAction}
            startIcon={loadingTopicAction ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Xác nhận xoá
          </Button>
        </DialogActions>
      </Dialog>

      {/* 9. Modal Thêm/Sửa Từ khóa gốc */}
      <Dialog 
        open={openKeywordDialog} 
        onClose={() => !loadingKeywordAction && setOpenKeywordDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {keywordDialogMode === 'add' ? 'Thêm từ khoá mới' : 'Chỉnh sửa từ khoá'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Từ khóa con"
            variant="outlined"
            value={keywordTextInput}
            onChange={(e) => setKeywordTextInput(e.target.value)}
            placeholder="Nhập từ khoá..."
            size="small"
            required
            disabled={loadingKeywordAction}
            error={!keywordTextInput.trim()}
            helperText={!keywordTextInput.trim() ? "Từ khoá không được để trống" : ""}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              label="Volume (Lượt tìm kiếm)"
              variant="outlined"
              type="number"
              value={keywordVolumeInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseInt(val) >= 0) {
                  setKeywordVolumeInput(val);
                }
              }}
              placeholder="Chưa cập nhật"
              size="small"
              disabled={loadingKeywordAction}
            />
            {keywordDialogMode === 'edit' && (
              <Tooltip title="Cập nhật volume từ Google Ads">
                <IconButton 
                  color="success" 
                  onClick={handleRefreshSingleKeywordVolume}
                  disabled={loadingKeywordAction}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                    p: 1
                  }}
                >
                  <SyncIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenKeywordDialog(false)} 
            disabled={loadingKeywordAction}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveKeyword}
            variant="contained"
            color="primary"
            disabled={loadingKeywordAction || !keywordTextInput.trim()}
            startIcon={loadingKeywordAction ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* 11. Modal Lưu nhanh Prompt tùy chỉnh */}
      <Dialog
        open={fastSaveOpen}
        onClose={() => !savingFastPrompt && setFastSaveOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Lưu prompt làm mẫu</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <TextField
            fullWidth
            label="Tên prompt mẫu"
            variant="outlined"
            value={fastSaveName}
            onChange={(e) => setFastSaveName(e.target.value)}
            placeholder="Ví dụ: Prompt chuẩn SEO, Prompt Luật hình sự..."
            size="small"
            required
            disabled={savingFastPrompt}
            error={!fastSaveName.trim() || fastSaveName.length > 200}
            helperText={
              !fastSaveName.trim()
                ? "Tên prompt không được để trống"
                : fastSaveName.length > 200
                ? "Tên prompt không được quá 200 ký tự"
                : ""
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setFastSaveOpen(false)}
            disabled={savingFastPrompt}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleFastSavePrompt}
            variant="contained"
            color="primary"
            disabled={savingFastPrompt || !fastSaveName.trim() || fastSaveName.length > 200}
            startIcon={savingFastPrompt ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* 12. Modal Quản lý Prompts (Chỉ Admin) */}
      <Dialog
        open={openPromptsManager}
        onClose={() => !savingPrompt && setOpenPromptsManager(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Quản lý danh sách Prompt gợi ý</span>
          {!promptFormOpen && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddPromptForm}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Thêm Prompt mới
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ p: promptFormOpen ? 2.5 : 0 }}>
          {promptFormOpen ? (
            // Form Thêm/Sửa Prompt
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {promptFormMode === 'add' ? 'Thêm prompt mới' : 'Chỉnh sửa prompt'}
              </Typography>
              <TextField
                fullWidth
                label="Tên prompt"
                variant="outlined"
                value={promptFormName}
                onChange={(e) => setPromptFormName(e.target.value)}
                placeholder="Nhập tên dễ nhớ (ví dụ: SEO Ngách Bất Động Sản)..."
                size="small"
                required
                disabled={savingPrompt}
                error={!promptFormName.trim() || promptFormName.length > 200}
                helperText={
                  !promptFormName.trim()
                    ? "Tên prompt không được để trống"
                    : promptFormName.length > 200
                    ? "Tên prompt không được quá 200 ký tự"
                    : ""
                }
              />
              <Box>
                <TextField
                  fullWidth
                  label="Nội dung prompt"
                  variant="outlined"
                  multiline
                  rows={8}
                  value={promptFormContent}
                  onChange={(e) => setPromptFormContent(e.target.value.slice(0, 5000))}
                  placeholder="Nhập nội dung prompt chi tiết để AI làm việc..."
                  required
                  disabled={savingPrompt}
                  error={!promptFormContent.trim()}
                  helperText={!promptFormContent.trim() ? "Nội dung prompt không được để trống" : ""}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                  <Typography variant="caption" color={promptFormContent.length >= 5000 ? 'error' : 'text.secondary'}>
                    {promptFormContent.length}/5000 ký tự
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                <Button
                  onClick={() => setPromptFormOpen(false)}
                  disabled={savingPrompt}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                  variant="text"
                  color="inherit"
                >
                  Hủy quay lại
                </Button>
                <Button
                  onClick={handleSavePromptForm}
                  variant="contained"
                  color="primary"
                  disabled={savingPrompt || !promptFormName.trim() || promptFormName.length > 200 || !promptFormContent.trim()}
                  startIcon={savingPrompt ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                >
                  Lưu thay đổi
                </Button>
              </Box>
            </Box>
          ) : (
            // Danh sách Prompt
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Tên Prompt</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Nội dung rút gọn</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="center" width={120}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promptsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        Chưa có prompt lưu trữ nào. Hãy thêm mới!
                      </TableCell>
                    </TableRow>
                  ) : (
                    promptsList.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{p.name}</TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary', fontFamily: 'monospace', fontSize: '11px' }}>
                          {p.content}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditPromptForm(p)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeletePrompt(p.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenPromptsManager(false)}
            disabled={savingPrompt}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            variant="outlined"
            color="inherit"
          >
            Đóng quản lý
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
